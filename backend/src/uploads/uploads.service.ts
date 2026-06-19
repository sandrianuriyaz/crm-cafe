import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

@Injectable()
export class UploadsService {
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private get bucket(): string {
    return this.config.get<string>('SUPABASE_BUCKET') ?? 'uploads';
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new ServiceUnavailableException(
        'Penyimpanan gambar belum dikonfigurasi (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
      );
    }
    this.client = createClient(url, key, { auth: { persistSession: false } });
    return this.client;
  }

  // Upload 1 gambar ke Supabase Storage, balas URL publik.
  async uploadImage(
    file: Express.Multer.File | undefined,
    folder = 'misc',
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Hanya gambar (JPG, PNG, WEBP, GIF)');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Ukuran gambar maksimal 2 MB');
    }

    const safeFolder = /^[a-z0-9_-]+$/i.test(folder) ? folder : 'misc';
    const ext =
      (file.originalname.split('.').pop() || 'jpg')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${safeFolder}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;

    const client = this.getClient();
    const { error } = await client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) {
      throw new BadRequestException(`Gagal mengunggah gambar: ${error.message}`);
    }

    const { data } = client.storage.from(this.bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}

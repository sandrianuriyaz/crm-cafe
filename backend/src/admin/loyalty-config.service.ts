import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class LoyaltyConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // Ambil config singleton; buat default kalau belum ada.
  get() {
    return this.prisma.loyaltyConfig.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  update(dto: UpdateLoyaltyConfigDto) {
    const { tierThresholds, ...rest } = dto;
    // Objek scalar plain: valid untuk update maupun create.
    const data = {
      ...rest,
      ...(tierThresholds !== undefined
        ? { tierThresholds: tierThresholds as Prisma.InputJsonValue }
        : {}),
    };
    return this.prisma.loyaltyConfig.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: { id: SINGLETON_ID, ...data },
    });
  }
}

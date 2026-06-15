import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  city: true,
  address: true,
  hours: true,
  phone: true,
  status: true,
} as const;

@Injectable()
export class OutletsService {
  constructor(private readonly prisma: PrismaService) {}

  // Publik: hanya outlet aktif.
  listPublic() {
    return this.prisma.outlet.findMany({
      where: { status: OutletStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: PUBLIC_SELECT,
    });
  }

  // Admin: semua outlet (termasuk INACTIVE).
  listAll() {
    return this.prisma.outlet.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateOutletDto) {
    return this.prisma.outlet.create({ data: dto });
  }

  async update(id: string, dto: UpdateOutletDto) {
    await this.getOrThrow(id);
    return this.prisma.outlet.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.outlet.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async getOrThrow(id: string) {
    const outlet = await this.prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new NotFoundException('Outlet tidak ditemukan');
    return outlet;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { ListOutletsQueryDto } from './dto/list-outlets-query.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { buildHoursLabel } from './outlet-schedule';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  city: true,
  address: true,
  hours: true,
  openTime: true,
  closeTime: true,
  closedDays: true,
  mapsUrl: true,
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

  // Admin: semua outlet (termasuk INACTIVE) — cari (nama/kota/alamat) + paginated.
  async listAll(q: ListOutletsQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.OutletWhereInput = q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { city: { contains: q.search, mode: 'insensitive' } },
            { address: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.outlet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.outlet.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  create(dto: CreateOutletDto) {
    return this.prisma.outlet.create({
      data: {
        ...dto,
        hours: buildHoursLabel(dto.openTime, dto.closeTime, dto.closedDays),
      },
    });
  }

  async update(id: string, dto: UpdateOutletDto) {
    const current = await this.getOrThrow(id);
    // PATCH bisa datang tanpa field jadwal (mis. cuma menonaktifkan outlet),
    // jadi hitung ulang label dari gabungan nilai lama + baru. Kalau hasilnya
    // null berarti jadwal memang belum pernah diisi — biarkan `hours` lama.
    const hours = buildHoursLabel(
      dto.openTime ?? current.openTime,
      dto.closeTime ?? current.closeTime,
      dto.closedDays ?? current.closedDays,
    );
    return this.prisma.outlet.update({
      where: { id },
      data: { ...dto, ...(hours ? { hours } : {}) },
    });
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

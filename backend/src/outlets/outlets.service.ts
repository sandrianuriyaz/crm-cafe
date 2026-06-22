import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { ListOutletsQueryDto } from './dto/list-outlets-query.dto';
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

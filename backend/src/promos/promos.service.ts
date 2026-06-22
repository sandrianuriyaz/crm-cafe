import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PromoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { ListPromosQueryDto } from './dto/list-promos-query.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Customer ──────────────────────────────────────────────────────────────
  // Promo aktif = status ACTIVE & sekarang dalam rentang startAt–endAt
  // (null = tak dibatasi di sisi itu).
  listActive() {
    const now = new Date();
    return this.prisma.promo.findMany({
      where: {
        status: PromoStatus.ACTIVE,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string) {
    const promo = await this.prisma.promo.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo tidak ditemukan');
    return promo;
  }

  // ── Admin ───────────────────────────────────────────────────────────────
  create(dto: CreatePromoDto) {
    return this.prisma.promo.create({ data: this.toData(dto) });
  }

  // Cari (judul/deskripsi) + paginated.
  async listAll(q: ListPromosQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.PromoWhereInput = q.search
      ? {
          OR: [
            { title: { contains: q.search, mode: 'insensitive' } },
            { description: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.promo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.promo.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  async update(id: string, dto: UpdatePromoDto) {
    await this.getOne(id);
    return this.prisma.promo.update({ where: { id }, data: this.toData(dto) });
  }

  async remove(id: string) {
    await this.getOne(id);
    // Soft-delete: nonaktifkan.
    return this.prisma.promo.update({
      where: { id },
      data: { status: PromoStatus.INACTIVE },
    });
  }

  // Ubah tanggal string ISO → Date untuk Prisma.
  private toData(dto: CreatePromoDto | UpdatePromoDto): Prisma.PromoUncheckedCreateInput {
    return {
      ...dto,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    } as Prisma.PromoUncheckedCreateInput;
  }
}

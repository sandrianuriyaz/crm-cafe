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
    const { outletIds, ...rest } = dto;
    return this.prisma.promo.create({
      data: {
        ...this.toData(rest),
        outlets: outletIds?.length
          ? { create: outletIds.map((outletId) => ({ outletId })) }
          : undefined,
      },
    });
  }

  // Cari (judul/deskripsi) + paginated. outlets di-include agar form edit admin
  // tahu tag outlet yang sudah dipilih tanpa fetch tambahan.
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
        include: { outlets: { include: { outlet: { select: { id: true, name: true } } } } },
      }),
      this.prisma.promo.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  // outletIds tidak dikirim (undefined) → tag outlet tidak diubah.
  // outletIds dikirim (termasuk []) → ganti seluruh tag jadi daftar ini.
  async update(id: string, dto: UpdatePromoDto) {
    await this.getOne(id);
    const { outletIds, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (outletIds !== undefined) {
        await tx.promoOutlet.deleteMany({ where: { promoId: id } });
        if (outletIds.length) {
          await tx.promoOutlet.createMany({
            data: outletIds.map((outletId) => ({ promoId: id, outletId })),
          });
        }
      }
      return tx.promo.update({ where: { id }, data: this.toData(rest) });
    });
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

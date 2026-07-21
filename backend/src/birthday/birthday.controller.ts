import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BirthdayService } from './birthday.service';
import { UpdateBirthdayConfigDto } from './dto/update-birthday-config.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/birthday')
export class BirthdayController {
  constructor(private readonly birthday: BirthdayService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Pengaturan hadiah ulang tahun' })
  get() {
    return this.birthday.getConfig();
  }

  @Patch()
  @ApiOperation({ summary: '[Admin] Ubah hadiah ulang tahun' })
  update(@Body() dto: UpdateBirthdayConfigDto) {
    return this.birthday.updateConfig(dto);
  }

  // Jalur pemulihan: bila server mati saat jadwal harian berjalan, hari itu
  // terlewat tanpa cara memperbaikinya. Aman diulang — grant unik per tahun.
  @Post('run')
  @HttpCode(200)
  @ApiOperation({ summary: '[Admin] Jalankan pemberian sekarang' })
  run() {
    return this.birthday.run();
  }
}

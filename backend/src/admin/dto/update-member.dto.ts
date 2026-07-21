import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateMemberDto {
  // Member tidak bisa mengubah tanggal lahirnya sendiri setelah terisi (cegah
  // panen reward ulang tahun) — admin jalur koreksinya. null = kosongkan lagi.
  @ApiPropertyOptional({
    example: '2000-05-17',
    nullable: true,
    description: 'Tanggal lahir; null untuk mengosongkan',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  birthDate?: string | null;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MinLength, NotEquals } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({
    example: 100,
    description: 'Poin yang ditambah (+) atau dikurangi (-). Tidak boleh 0.',
  })
  @IsInt()
  @NotEquals(0)
  points!: number;

  @ApiProperty({ example: 'Kompensasi komplain pelanggan' })
  @IsString()
  @MinLength(3)
  reason!: string;
}

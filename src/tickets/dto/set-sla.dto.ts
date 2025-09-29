// src/tickets/dto/set-sla.dto.ts
import { IsInt, Min, IsOptional, IsNumber, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SetSlaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dias: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  greenPct?: number;   // 0..1

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  yellowPct?: number;  // 0..1

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  redPct?: number;     // 0..1
}

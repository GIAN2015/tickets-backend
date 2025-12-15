// src/tickets/dto/set-sla.dto.ts
import { IsInt, Min, IsOptional, IsNumber, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class SetSlaDto {
  // Si NO viene totalMinutos, entonces se exige dias
  @ValidateIf(o => o.totalMinutos == null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dias?: number;

  // Si NO viene dias, entonces se exige totalMinutos
  @ValidateIf(o => o.dias == null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  greenPct?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  yellowPct?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0) @Max(1)
  redPct?: number;
}

import { IsInt, Min } from 'class-validator';

export class AssignTiDto {
  @IsInt()
  @Min(1)
  userId!: number;
}

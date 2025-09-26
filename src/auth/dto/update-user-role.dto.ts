// src/auth/dto/update-user-role.dto.ts
import { IsEnum } from 'class-validator';
export enum Role {
  SUPER_ADMI = 'super-admi',
  ADMIN = 'admin',
  USER = 'user',
  TI = 'ti',
}
export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}

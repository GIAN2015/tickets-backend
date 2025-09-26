// update-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  // ❌ role se elimina de aquí para que nunca lo toque este endpoint
  // ❌ empresaId y smtpPassword también si no quieres que cualquiera lo edite
}

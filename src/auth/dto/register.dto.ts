// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  // ----------- Usuario -----------
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  // ----------- Empresa -----------
  @IsNotEmpty()
  @IsString()
  razonSocial: string;

  @IsNotEmpty()
  @IsString()
  numeroEmpresa: string; // teléfono

  @IsNotEmpty()
  @IsString()
  ruc: string;

  @IsOptional()
  @IsString()
  logo?: string; // opcional, si luego subes la imagen
}

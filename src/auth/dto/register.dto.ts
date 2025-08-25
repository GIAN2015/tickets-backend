// src/auth/dto/register-empresa.dto.ts
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterEmpresaDto {
  // ---- Datos de la empresa ----
  @IsNotEmpty()
  razonSocial: string;

  @IsNotEmpty()
  telefono: string;

  @IsNotEmpty()
  ruc: string;

  logo?: string;

  @IsEmail()
  correoContacto: string;

  // ---- Datos del admin ----
  @IsNotEmpty()
  adminNombre: string;

  @IsEmail()
  adminEmail: string;

  @MinLength(6)
  adminPassword: string;
}

import { IsEmail, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class RegisterEmpresaDto {
  @IsNotEmpty()
  razonSocial: string;

  @IsNotEmpty()
  @Length(7, 15)
  telefono: string;

  @IsEmail()
  correoContacto: string;

  @IsNotEmpty()
  @Length(11, 11, { message: 'El RUC debe tener 11 dígitos' })
  ruc: string;

  @IsOptional()
  logo?: string;

  // Datos del admin
  @IsNotEmpty()
  adminNombre: string;

  @IsEmail()
  adminEmail: string;

  @Length(6)
  adminPassword: string;
}

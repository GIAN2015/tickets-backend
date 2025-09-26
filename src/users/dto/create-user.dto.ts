// create-user.dto.ts
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsEnum(Role, { message: 'Role must be super-admi, admin, user, or ti' })
  role: Role;


  @IsOptional()
  @IsInt()
  empresaId?: number;
  @IsOptional()
  smtpPassword?: string;
}

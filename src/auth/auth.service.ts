// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { EmpresasService } from 'src/empresas/empresas.service';
import { UsersService } from 'src/users/users.service';
import { RegisterEmpresaDto } from 'src/empresas/dto/create-empresa.dto';
import { Role } from 'src/enums/role.enum';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly empresasService: EmpresasService,
    private readonly usersService: UsersService,

    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterEmpresaDto) {
    // 1. Crear empresa
    const empresa = await this.empresasService.create({

      razonSocial: dto.razonSocial,
      telefono: dto.telefono,
      ruc: dto.ruc,
      logo: dto.logo,
      correoContacto: dto.correoContacto,
    });

    // 2. Crear admin vinculado a la empresa
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const admin = await this.usersService.create(
      {
        username: dto.adminNombre,
        email: dto.adminEmail,
        password: dto.adminPassword,
        role: Role.ADMIN,
      },
      empresa, // 🔗 vinculamos empresa
    );

    return {
      message: 'Empresa y administrador creados correctamente',
      empresa,
      admin: { id: admin.id, username: admin.username, email: admin.email },
    };


  }

  async login(dto: { email: string; password: string }) {
    console.log('DTO recibido:', dto);

    const user = await this.usersService.findByEmail(dto.email);
    console.log('Usuario encontrado:', user);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    console.log('DTO Password:', dto.password);
    console.log('User Password Hash:', user.password);
    const isMatch = await bcrypt.compare(dto.password, user.password);
    console.log('Password Match?', isMatch);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,

      },
    };
  }

}
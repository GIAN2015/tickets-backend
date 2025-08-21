// src/empresas/empresas.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresas/entities/empresas.entity'; // 👈 corregí nombre del archivo
import { RegisterEmpresaDto } from './dto/create-empresa.dto';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmpresasService {
  findAll() {
    throw new Error('Method not implemented.');
  }
  findOne(arg0: number) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,




    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createEmpresaDto: RegisterEmpresaDto) {
    const { razonSocial, telefono, ruc, logo, correoContacto, adminNombre, adminEmail, adminPassword } =
      createEmpresaDto;

    const empresa = this.empresaRepository.create({
      razonSocial,
      telefono,
      ruc,
      logo,
      correoContacto,
    });
   


    // 1. Verificar si ya existe empresa con mismo número
    const existeEmpresa = await this.empresaRepository.findOne({
      where: { telefono },
    });
    if (existeEmpresa) {
      throw new BadRequestException('Ya existe una empresa con ese número');
    }


    await this.empresaRepository.save(empresa);

    // 3. Verificar si ya existe un usuario con ese email
    const existeUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });
    if (existeUser) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    // 4. Crear admin ligado a esa empresa
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = this.userRepository.create({
      username: adminNombre,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin', // 👈 corregido (era rol)
      empresa: empresa,
    });
    await this.userRepository.save(admin);

    return {
      message: 'Empresa y admin creados correctamente',
      empresa,
      admin: {
        id: admin.id,
        nombre: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}

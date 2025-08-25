// src/empresas/empresas.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresas/entities/empresas.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) { }

  async create(data: Partial<Empresa>) {
    const empresa = this.empresaRepository.create(data);
    return await this.empresaRepository.save(empresa);
  }

  async findOne(id: number) {
    return await this.empresaRepository.findOne({ where: { id } });
  }
  async findAll() {
    return await this.empresaRepository.find({ relations: ['usuarios'] });
  }
}

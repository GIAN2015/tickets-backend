// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/mail.service';
import { Empresa } from 'src/empresas/entities/empresas.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, User]),
  ],
  providers: [MailService],
  exports: [MailService], // <- ¡IMPORTANTE!
})
export class MailModule {}

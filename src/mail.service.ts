import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { User, UserRole } from 'src/users/user.entity';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async enviarCorreo(empresaId: number, to: string, subject: string, html: string) {
    // Buscar admin de la empresa
    const admin = await this.userRepo.findOne({
      where: { empresaId, role: UserRole.ADMIN },
    });

    if (!admin || !admin.smtpPassword) {
      throw new Error('El admin no tiene configurado su correo de envío');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: admin.email,
        pass: admin.smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `"${admin.username}" <${admin.email}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  }
}

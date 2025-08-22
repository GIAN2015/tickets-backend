import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketHistory } from 'src/tickets/entities/tickethistory.entity/tickethistory.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { request } from 'http';
import { Categoria } from './ticket.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { extname } from 'path';
import { MulterField } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { JwtPayload } from 'src/auth/types/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  ticketsRepo: any;
  ticketRepository: any;
  constructor(
    private readonly ticketsService: TicketsService,
    @InjectRepository(TicketHistory)
    private readonly historyRepo: Repository<TicketHistory>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './tickets',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
  }))
  create(
    @Body() dto: {
      title: string;
      description: string;
      categoria?: 'mantenimiento' | 'hardware' | 'software' | 'redes' | 'otros';
      usuarioSolicitanteId?: number;
      prioridad?: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';
      tipo?: 'requerimiento' | 'incidencia' | 'consulta';
      archivoNombre?: string; // Nombre del archivo subido
    },

    @Req() req: RequestWithUser,
    @UploadedFile() archivo?: Express.Multer.File,

  ) {
    console.log('Body recibido:', dto);
    console.log('Archivo recibido:', archivo);

    return this.ticketsService.create({
      ...dto,
      creatorId: req.user.id,
      categoria: dto.categoria ? Categoria[dto.categoria.toUpperCase()] : undefined,
      archivoNombre: archivo?.filename,

    });

  }

  // tickets.controller.ts
  @Get()
  async getAll(@Req() req: RequestWithUser) {
    const user = req.user as JwtPayload;
    console.log('User que solicita tickets:', user);

    return this.ticketsService.findAll({
      id: user.id,
      role: user.role,
      empresaId: user.empresaId,
    });
  }




  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const user = req.user;

    if (!user) {
      throw new NotFoundException('Usuario no autenticado');
    }


    if (user.role === 'user') {
      return this.ticketsService.findByCreatorId(user.id);
    }

    if (user.role === 'ti') {
      return this.ticketsService.findByAssignedId(user.id);
    }

    return [];
  }



  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './tickets',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      }
    })
  }))
  async update(
    @Param('id') id: number,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: req.user.id } });


    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }



    return this.ticketsService.update(+id, updateTicketDto, user, archivo?.filename);


  }

  @Get(':id/historial')
  async getHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.historyRepo.find({
      where: { ticket: { id } },
      relations: ['ticket', 'actualizadoPor'],
      select: {
        id: true,
        statusAnterior: true,
        statusNuevo: true,
        prioridadAnterior: true,
        prioridadNueva: true,
        fecha: true,
        mensaje: true,
        actualizadoPor: {
          id: true,
          username: true,
          email: true
        },
        adjuntoNombre: true,
      },
      order: { fecha: 'DESC' },
    });
  }

  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard)
  async confirmarResolucion(
    @Param('id') id: number,
    @Req() req: RequestWithUser,
  ) {
    const ticketActualizado = await this.ticketsService.confirmarResolucion(+id, req.user);

    console.log('Ticket actualizado desde backend:', ticketActualizado);

    return ticketActualizado;
  }


  @Patch(':id/rechazar')
  @UseGuards(JwtAuthGuard)
  async rechazarResolucion(
    @Param('id') id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.ticketsService.rechazarResolucion(+id, req.user.id);
  }
  @Patch(':id/reset-rechazo')
  async resetRechazo(@Param('id') id: number) {
    return this.ticketsService.actualizarRechazo(+id, false);
  }

  // tickets.controller.ts
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Get(':archivoNombre')
  async verArchivo(@Param('archivoNombre') archivoNombre: string, @Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', archivoNombre); // Ajusta esta ruta si tu carpeta "uploads" está en otra ubicación
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'Archivo no encontrado' });
    }
  }
}
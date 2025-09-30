import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Categoria } from '../ticket.entity';

export class CreateTicketDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsEnum(['requerimiento','incidencia','consulta'] as any)
  tipo: 'requerimiento' | 'incidencia' | 'consulta';

  @IsEnum(Categoria) @IsOptional()
  categoria?: Categoria;

  @IsEnum(['muy_bajo','bajo','media','alta','muy_alta'] as any) @IsOptional()
  prioridad?: 'muy_bajo' | 'bajo' | 'media' | 'alta' | 'muy_alta';

  // Solo admin puede enviarlos; se validan en el service
  @IsNumber() @IsOptional()
  usuarioSolicitanteId?: number;

  @IsNumber() @IsOptional()
  assignedToId?: number;
}

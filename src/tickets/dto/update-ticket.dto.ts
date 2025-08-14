import { IsOptional, IsIn, IsString } from 'class-validator';

export const TicketStatusArray = ['no iniciado', 'asignado', 'en proceso', 'resuelto', 'completado'] as const;
export const TicketPrioridadArray = ['muy_bajo', 'bajo', 'media', 'alta', 'muy_alta'] as const;

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(TicketStatusArray, { message: 'Status inválido' })
  status?: typeof TicketStatusArray[number];

  @IsOptional()
  @IsIn(TicketPrioridadArray, { message: 'Prioridad inválida' })
  prioridad?: typeof TicketPrioridadArray[number];

  @IsOptional()
  @IsString()
  message?: string;
}

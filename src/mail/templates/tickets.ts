// src/mail/templates/tickets.ts
import { wrapEmail, list, escapeHtml, BRAND } from './base';

type TicketLite = {
  id: number;
  title: string;
  description?: string;
  prioridad?: string;
  categoria?: string;
  status?: string;
};

export const TicketTemplates = {
  creado(t: TicketLite) {
    return wrapEmail({
      title: `Nuevo Ticket #${t.id}`,
      preview: `Se creó el ticket #${t.id}: ${t.title}`,
      bodyHtml: `
        <p>Hola,</p>
        <p>Se ha creado un nuevo ticket en <strong>${escapeHtml(BRAND.appName)}</strong>:</p>
        ${list([
          { label: 'Ticket', value: `#${t.id}` },
          { label: 'Título', value: t.title },
          { label: 'Descripción', value: t.description ?? '' },
          { label: 'Prioridad', value: t.prioridad ?? 'media' },
          { label: 'Categoría', value: t.categoria ?? 'otros' },
        ])}
      `,
      cta: { label: 'Ver ticket', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  actualizado(t: TicketLite & { newStatus?: string; newPrioridad?: string; message?: string }) {
    return wrapEmail({
      title: `Actualización del Ticket #${t.id}`,
      preview: `Actualización #${t.id}${t.newStatus ? ` → ${t.newStatus}` : ''}`,
      bodyHtml: `
        <p>El ticket <strong>#${t.id}</strong> ha sido actualizado.</p>
        ${list([
          { label: 'Título', value: t.title },
          { label: 'Nuevo estado', value: t.newStatus ?? '' },
          { label: 'Nueva prioridad', value: t.newPrioridad ?? '' },
          { label: 'Mensaje', value: t.message ?? '' },
        ])}
      `,
      cta: { label: 'Revisar cambios', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  aceptado(t: TicketLite, encargadoNombre: string, encargadoEmail?: string) {
    return wrapEmail({
      title: `Ticket #${t.id} aceptado`,
      preview: `El ticket #${t.id} fue aceptado por TI`,
      bodyHtml: `
        <p>Tu ticket <strong>#${t.id}</strong> ha sido aceptado por el equipo TI.</p>
        ${list([
          { label: 'Título', value: t.title },
          { label: 'Encargado', value: encargadoNombre },
          { label: 'Contacto', value: encargadoEmail ?? '' },
        ])}
      `,
      cta: { label: 'Abrir ticket', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  confirmado(t: TicketLite) {
    return wrapEmail({
      title: `Ticket #${t.id} confirmado ✅`,
      preview: `Confirmación del ticket #${t.id}`,
      bodyHtml: `
        <p>El ticket <strong>#${t.id}</strong> ha sido confirmado por el usuario.</p>
        ${list([
          { label: 'Estado final', value: 'Completado' },
          { label: 'Título', value: t.title },
        ])}
      `,
      cta: { label: 'Ver ticket', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  rechazado(t: TicketLite) {
    return wrapEmail({
      title: `Ticket #${t.id} rechazado ❌`,
      preview: `Rechazo de la resolución del ticket #${t.id}`,
      bodyHtml: `
        <p>El ticket <strong>#${t.id}</strong> ha sido <b>rechazado</b> por el usuario.</p>
        <p>El equipo de TI deberá revisarlo nuevamente.</p>
        ${list([
          { label: 'Título', value: t.title },
          { label: 'Estado', value: t.status ?? 'en proceso' },
        ])}
      `,
      cta: { label: 'Revisar ticket', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  slaFijado(t: TicketLite, fechas: { green?: Date; yellow?: Date; deadline?: Date }) {
    const fmt = (d?: Date) => (d ? d.toLocaleString() : '');
    return wrapEmail({
      title: `SLA fijado para Ticket #${t.id}`,
      preview: `SLA definido, vencimiento ${fmt(fechas.deadline)}`,
      bodyHtml: `
        <p>Se ha definido un SLA para el ticket <strong>#${t.id}</strong>.</p>
        ${list([
          { label: 'Título', value: t.title },
          { label: 'Inicio Verde', value: fmt(fechas.green) },
          { label: 'Inicio Amarillo', value: fmt(fechas.yellow) },
          { label: 'Fecha límite', value: fmt(fechas.deadline) },
        ])}
      `,
      cta: { label: 'Ver detalle', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },

  asignado(t: TicketLite, tiNombre: string, tiEmail?: string) {
    return wrapEmail({
      title: `Ticket #${t.id} asignado`,
      preview: `Asignado a ${tiNombre}`,
      bodyHtml: `
        <p>El ticket <strong>#${t.id}</strong> fue asignado.</p>
        ${list([
          { label: 'Título', value: t.title },
          { label: 'Asignado a', value: tiNombre },
          { label: 'Contacto', value: tiEmail ?? '' },
        ])}
      `,
      cta: { label: 'Abrir ticket', url: `${BRAND.appUrl}/tickets/${t.id}` },
    });
  },
};

// src/mail/templates/users.ts
import { wrapEmail, list, BRAND, escapeHtml } from './base';

export function userBienvenida(opts: {
  nombre?: string;
  email: string;
  passwordTemporal: string;
}) {
  const nombre = opts.nombre ?? 'Usuario';
  return wrapEmail({
    title: `Bienvenido(a) a ${BRAND.appName}`,
    preview: `Accede y cambia tu contraseña`,
    bodyHtml: `
      <p>Hola, <strong>${escapeHtml(nombre)}</strong> 👋</p>
      <p>Tu cuenta ha sido creada en <strong>${escapeHtml(BRAND.appName)}</strong>. Usa estas credenciales para ingresar (se recomienda cambiar la contraseña al primer acceso):</p>
      ${list([
        { label: 'Usuario (email)', value: opts.email },
        { label: 'Contraseña temporal', value: opts.passwordTemporal },
      ])}
      <p style="margin-top:12px">Sigue este enlace para acceder:</p>
    `,
    cta: { label: 'Ir al sistema', url: BRAND.appUrl },
  });
}

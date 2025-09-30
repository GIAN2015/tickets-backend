// src/mail/templates/base.ts
export const BRAND = {
  appName: 'Sistema de Tickets',
  appUrl: 'https://sistema-tickets.danyris.com',
  logoUrl: 'https://sistema-tickets.danyris.com/logo.png', // opcional si tienes
  supportEmail: 'soporte@sistema-tickets.danyris.com',      // cambia si aplica
  footerNote:
    'Este es un mensaje automático. Si no esperabas este correo, ignóralo.',
};

type CTA = { label: string; url: string } | null;

export function wrapEmail({
  title,
  preview,
  bodyHtml,
  cta,
}: {
  title: string;
  preview?: string;
  bodyHtml: string;
  cta?: CTA;
}) {
  const previewText = preview ?? title;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    /* Estilos inline-compatibles y seguros */
    .container { max-width:600px;margin:0 auto;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#111; }
    .card { background:#ffffff;border:1px solid #eee;border-radius:10px;padding:24px; }
    .muted { color:#666;font-size:12px; }
    .badge { display:inline-block;padding:4px 10px;border-radius:999px;background:#f2f4f7;color:#111;font-size:12px;border:1px solid #e5e7eb; }
    .btn { display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;border:1px solid #0ea5e9;background:#0ea5e9;color:#fff;font-weight:600; }
    .btn:hover { filter:brightness(0.95); }
    .kbd { font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
           background:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:2px 6px; }
    .sep { height:1px;background:#eee;margin:16px 0; }
    a { color:#0ea5e9; }
    @media (prefers-color-scheme: dark) {
      body { background:#0b0f19; color:#e5e7eb; }
      .card { background:#111827;border-color:#1f2937; }
      .muted { color:#9ca3af; }
      .badge { background:#111827;color:#e5e7eb;border-color:#1f2937; }
      .sep { background:#1f2937; }
    }
  </style>
</head>
<body style="margin:0;padding:16px;background:#f6f7fb;">
  <!-- preview text -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    ${escapeHtml(previewText)}
  </div>

  <div class="container">
    <div style="text-align:center;margin:12px 0 18px">
      ${BRAND.logoUrl ? `<img src="${BRAND.logoUrl}" alt="${escapeHtml(BRAND.appName)}" style="height:40px">` : `<strong style="font-size:18px">${escapeHtml(BRAND.appName)}</strong>`}
    </div>

    <div class="card">
      <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>

      ${bodyHtml}

      ${cta ? `
      <div style="margin-top:20px">
        <a class="btn" href="${cta.url}" target="_blank" rel="noopener">${escapeHtml(cta.label)}</a>
      </div>` : ''}

      <div class="sep"></div>
      <p class="muted">
        ${escapeHtml(BRAND.footerNote)}
        ${BRAND.supportEmail ? `<br>Soporte: <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>` : ''}
      </p>
    </div>

    <p class="muted" style="text-align:center;margin:12px 0">
      © ${new Date().getFullYear()} ${escapeHtml(BRAND.appName)}
    </p>
  </div>
</body>
</html>`;
}

export function line(label: string, value: string | number | undefined | null) {
  if (value === undefined || value === null || value === '') return '';
  return `<p style="margin:4px 0"><span class="badge">${escapeHtml(label)}</span> ${escapeHtml(String(value))}</p>`;
}

export function list(items: Array<{ label: string; value: string | number | null | undefined }>) {
  return items
    .map(i => line(i.label, i.value))
    .join('');
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

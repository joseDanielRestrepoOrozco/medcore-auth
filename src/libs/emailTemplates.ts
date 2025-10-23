type VerifyEmailParams = {
  brand?: string;
  code: string;
  verifyUrl?: string;
  supportEmail?: string;
};

const baseStyles = {
  bg: '#f8fafc', // slate-50
  cardBg: '#ffffff',
  text: '#0f172a', // slate-900
  muted: '#475569', // slate-600
  border: '#e2e8f0', // slate-200
  primary: '#0ea5e9', // sky-500
  primaryText: '#ffffff',
  codeBg: '#0b1220', // navy-ish
  codeText: '#e2e8f0',
};

export function renderVerificationEmail({ brand = 'MedCore', code, verifyUrl, supportEmail }: VerifyEmailParams): string {
  const preheader = `${brand}: Tu código de verificación es ${code}`;
  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${brand} - Verifica tu correo</title>
    <style>
      /* Resets básicos */
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; }
      body { margin: 0; padding: 0; background: ${baseStyles.bg}; }
      table { border-collapse: collapse !important; }
      /* Dark mode considerate - limitado en clientes */
      @media (prefers-color-scheme: dark) {
        body { background: #0b1220 !important; }
      }
    </style>
  </head>
  <body style="background:${baseStyles.bg}; margin:0; padding:24px;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      ${preheader}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" width="600" style="max-width:600px; background:${baseStyles.cardBg}; border-radius:16px; box-shadow:0 10px 25px rgba(2,6,23,0.06); border:1px solid ${baseStyles.border}; overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 0 24px; text-align:center;">
                <div style="display:inline-block; padding:8px 14px; border-radius:9999px; background:${baseStyles.bg}; color:${baseStyles.muted}; font:600 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; border:1px solid ${baseStyles.border};">${brand}</div>
                <h1 style="margin:16px 0 8px; font:700 22px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; color:${baseStyles.text};">Verifica tu correo electrónico</h1>
                <p style="margin:0 0 20px; font:400 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; color:${baseStyles.muted};">Usa el siguiente código para completar tu registro.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 8px;">
                <div style="background:${baseStyles.codeBg}; color:${baseStyles.codeText}; border-radius:12px; text-align:center; padding:18px 20px; letter-spacing:4px; font:700 28px/1 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu;">${code}</div>
              </td>
            </tr>

            ${verifyUrl ? `
            <tr>
              <td align="center" style="padding:8px 24px 0;">
                <a href="${verifyUrl}"
                   style="display:inline-block; margin:8px 0 0; background:${baseStyles.primary}; color:${baseStyles.primaryText}; text-decoration:none; font:600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; padding:12px 18px; border-radius:10px;">
                  Verificar ahora
                </a>
              </td>
            </tr>` : ''}

            <tr>
              <td style="padding:16px 24px 8px;">
                <p style="margin:0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; color:${baseStyles.muted};">Este código expira en pocos minutos. Si no solicitaste este correo, puedes ignorarlo.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:12px 24px 24px; border-top:1px solid ${baseStyles.border}; text-align:center;">
                <p style="margin:12px 0 0; font:400 12px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu; color:${baseStyles.muted};">
                  ¿Necesitas ayuda? ${supportEmail ? `Escríbenos a <a href="mailto:${supportEmail}" style="color:${baseStyles.muted}; text-decoration:underline;">${supportEmail}</a>` : ''}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}


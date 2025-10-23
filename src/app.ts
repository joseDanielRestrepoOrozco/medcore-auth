import express from 'express';
import { sendVerificationEmail } from './libs/mailer.js';
import { FRONTEND_ORIGIN, JWT_EXPIRES_IN, JWT_SECRET } from './libs/config.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

app.use(express.json());

// Health
app.get('/', (_req, res) => {
  res.send('Auth Service is running');
});

// Stubs de autenticación bajo /api/v1/auth (solo si USE_STUBS=true)
if (process.env.USE_STUBS === 'true') {
  app.post('/api/v1/auth/log-in', (req, res) => {
    const { email } = req.body || {};
    const user = {
      id: 'u_demo',
      email: email || 'demo@example.com',
      fullname: 'Usuario Demo',
      status: 'VERIFIED',
      role: 'ADMINISTRADOR',
    };
    res.json({ message: 'Inicio de sesión exitoso', user, token: 'demo-token' });
  });

  app.post('/api/v1/auth/sign-up', async (req, res) => {
    const { email, fullname } = req.body || {};
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    let previewUrl: string | undefined;
    const verifyUrl = email ? `${FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}` : undefined;
    try {
      if (email) {
        const r = await sendVerificationEmail(email, verificationCode, verifyUrl);
        // Log para desarrollo
        if (r.previewUrl) {
          previewUrl = r.previewUrl;
          console.log('[AUTH] Preview email URL:', r.previewUrl);
        }
      }
    } catch (e) {
      console.error('[AUTH] Error enviando correo:', e);
    }
    res.json({
      id: 'u_new',
      email: email || 'nuevo@example.com',
      fullname: fullname || 'Nuevo Usuario',
      status: 'PENDING',
      message: 'Registro exitoso, verifica tu correo',
      devPreviewUrl: previewUrl,
      devVerificationCode: verificationCode,
    });
  });

  app.post('/api/v1/auth/verify-email', (_req, res) => {
    const user = {
      id: 'u_demo',
      email: 'demo@example.com',
      fullname: 'Usuario Demo',
      status: 'VERIFIED',
      role: 'ADMINISTRADOR',
    };
    res.json({ message: 'Cuenta verificada', user });
  });

  app.post('/api/v1/auth/resend-verification-code', async (req, res) => {
    const { email } = req.body || {};
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    let previewUrl: string | undefined;
    const verifyUrl = email ? `${FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}` : undefined;
    try {
      if (email) {
        const r = await sendVerificationEmail(email, verificationCode, verifyUrl);
        if (r.previewUrl) {
          previewUrl = r.previewUrl;
          console.log('[AUTH] Preview email URL:', r.previewUrl);
        }
      }
    } catch (e) {
      console.error('[AUTH] Error reenviando correo:', e);
    }
    res.json({ message: 'Código reenviado', devPreviewUrl: previewUrl, devVerificationCode: verificationCode });
  });

  app.post('/api/v1/auth/forgot-password', (_req, res) => {
    res.json({ message: 'Si el correo existe, se enviará un enlace' });
  });
}

// Endpoints reales (DB) cuando USE_STUBS != 'true'
if (process.env.USE_STUBS !== 'true') {
  const prisma = new PrismaClient();

  // Registro
  app.post('/api/v1/auth/sign-up', async (req, res) => {
    try {
      const { email, fullname, currentPassword } = req.body || {};
      if (!email || !currentPassword) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const passwordHash = await bcrypt.hash(String(currentPassword), 10);
      const created = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          name: fullname || null,
          emailVerified: false,
        },
      });
      // Envía correo de verificación (si hay configuración SMTP o usando Ethereal en dev)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verifyUrl = `${FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;
      try {
        const r = await sendVerificationEmail(email, verificationCode, verifyUrl);
        if (r.previewUrl) console.log('[AUTH] Preview email URL:', r.previewUrl);
      } catch (e) {
        console.error('[AUTH] Error enviando correo:', e);
      }
      return res.json({
        id: created.id,
        email: created.email,
        fullname: created.name || '',
        status: created.emailVerified ? 'VERIFIED' : 'PENDING',
        message: 'Registro exitoso, verifica tu correo',
      });
    } catch (e) {
      console.error('[AUTH] sign-up error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login
  app.post('/api/v1/auth/log-in', async (req, res) => {
    try {
      const { email, currentPassword } = req.body || {};
      if (!email || !currentPassword) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'credenciales inválidas' });
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });
      if (!user.emailVerified) return res.status(401).json({ error: 'email no verificado' });

      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const authUser = {
        id: user.id,
        email: user.email,
        fullname: user.name || '',
        status: user.emailVerified ? 'VERIFIED' : 'PENDING',
        role: 'ADMINISTRADOR', // ajustar cuando exista modelo de roles
      };
      return res.json({ message: 'Inicio de sesión exitoso', user: authUser, token });
    } catch (e) {
      console.error('[AUTH] log-in error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verificar email (simple: marca como verificado)
  app.post('/api/v1/auth/verify-email', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Datos inválidos' });
      const updated = await prisma.user.update({ where: { email }, data: { emailVerified: true } });
      const authUser = {
        id: updated.id,
        email: updated.email,
        fullname: updated.name || '',
        status: updated.emailVerified ? 'VERIFIED' : 'PENDING',
        role: 'ADMINISTRADOR',
      };
      return res.json({ message: 'Cuenta verificada', user: authUser });
    } catch (e) {
      console.error('[AUTH] verify-email error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reenviar código (envía email, no valida código todavía)
  app.post('/api/v1/auth/resend-verification-code', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Datos inválidos' });
      // Confirma que el usuario exista
      const found = await prisma.user.findUnique({ where: { email } });
      if (!found) return res.status(404).json({ error: 'No encontrado' });
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verifyUrl = `${FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;
      const r = await sendVerificationEmail(email, verificationCode, verifyUrl);
      if (r.previewUrl) console.log('[AUTH] Preview email URL:', r.previewUrl);
      return res.json({ message: 'Código reenviado' });
    } catch (e) {
      console.error('[AUTH] resend-verification-code error', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

app.post('/api/v1/auth/forgot-password', (_req, res) => {
  res.json({ message: 'Si el correo existe, se enviará un enlace' });
});

export default app;

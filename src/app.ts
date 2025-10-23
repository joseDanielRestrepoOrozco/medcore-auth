import express from 'express';
import dns from 'dns';
import { sendVerificationEmail } from './libs/mailer.js';
import { FRONTEND_ORIGIN, JWT_EXPIRES_IN, JWT_SECRET, PATIENTS_SERVICE_URL } from './libs/config.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Forzar IPv4 primero para conexiones Atlas (evita problemas SRV/IPv6)
dns.setDefaultResultOrder('ipv4first');
const app = express();

app.use(express.json());

// Safe DB target log (host + db only)
(() => {
  const raw = process.env.DATABASE_URL || '';
  let host = '(unknown)';
  let db = '(unknown)';
  try {
    const repl = raw.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const u = new URL(repl);
    host = u.host;
    db = (u.pathname || '').replace(/^\//, '') || '(none)';
  } catch {
    const m = raw.match(/@([^/]+)\/?([^?]*)/);
    if (m) {
      host = m[1];
      db = m[2] || '(none)';
    }
  }
  console.log('[AUTH] DB target', { host, db });
})();

// Health
app.get('/', (_req, res) => {
  res.send('Auth Service is running');
});

// Debug endpoint to verify DB connectivity
app.get('/api/v1/_debug/db', async (_req, res) => {
  try {
    const total = await prisma.users.count();
    res.json({ ok: true, service: 'auth', users: total });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Endpoints reales (DB)
const prisma = new PrismaClient();

// Helper para mostrar URL de destino en logs sin credenciales
const maskDbUrl = (raw: string): string => {
  try {
    const isSrv = raw.startsWith('mongodb+srv://');
    const normalized = raw.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    const u = new URL(normalized);
    const user = u.username ? encodeURIComponent(u.username) : '';
    const pass = u.password ? '***' : '';
    const auth = user ? `${user}:${pass}@` : '';
    const db = (u.pathname || '').replace(/^\//, '');
    const protocol = isSrv ? 'mongodb+srv://' : 'mongodb://';
    const query = u.search || '';
    return `${protocol}${auth}${u.host}/${db}${query}`;
  } catch {
    return '(invalid DATABASE_URL)';
  }
};

// DB ping opcional (actívalo exportando DB_PING=true)
(async () => {
  const shouldPing = String(process.env.DB_PING || 'false').toLowerCase() === 'true';
  if (!shouldPing) return;
  try {
    if (typeof (prisma as unknown as { $runCommandRaw?: (cmd: unknown) => Promise<unknown> }).$runCommandRaw === 'function') {
      await (prisma as unknown as { $runCommandRaw: (cmd: unknown) => Promise<unknown> }).$runCommandRaw({ ping: 1 });
      console.log('[AUTH] DB ping ok ->', maskDbUrl(process.env.DATABASE_URL || ''));
    }
  } catch (e) {
    console.warn('[AUTH] DB ping skipped/failed', (e as Error)?.message);
  }
})();

// Helpers
const computeAge = (dateStr: string): number => {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

// Registro (crea en colección Users)
app.post('/api/v1/auth/sign-up', async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const email = String(b.email || '');
    const fullname = (b.fullname as string) || '';
    const currentPassword = String(b.currentPassword ?? b.current_password ?? '');
    const dateOfBirth = String(b.date_of_birth ?? b.dateOfBirth ?? b.birthDate ?? '');
    const role = (b.role as string) || 'PACIENTE';
    if (!email || !currentPassword || !dateOfBirth) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    const exists = await prisma.users.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(String(currentPassword), 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    const created = await prisma.users.create({
      data: {
        email,
        fullname,
        current_password: passwordHash,
        date_of_birth: new Date(dateOfBirth),
        age: computeAge(dateOfBirth),
        status: 'PENDING',
        verificationCode,
        verificationCodeExpires,
        role: role as any,
      },
    });
    console.log('[AUTH] user created', created.id);
    // Envía correo de verificación
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
      fullname: created.fullname,
      status: created.status,
      role: created.role,
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
    const b = req.body as Record<string, unknown>;
    const email = String(b.email || '');
    const currentPassword = String(b.currentPassword ?? b.current_password ?? '');
    if (!email || !currentPassword) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (user) {
      const ok = await bcrypt.compare(String(currentPassword), user.current_password);
      if (!ok) return res.status(401).json({ error: 'credenciales inválidas' });
      if (user.status !== 'ACTIVE') return res.status(401).json({ error: 'email no verificado' });
      const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const authUser = { id: user.id, email: user.email, fullname: user.fullname, status: user.status, role: user.role };
      return res.json({ message: 'Inicio de sesión exitoso', user: authUser, token });
    }

    // Fallback: validar en pacientes
    const resp = await fetch(`${PATIENTS_SERVICE_URL}/api/v1/patients/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword })
    });
    if (!resp.ok) return res.status(401).json({ error: 'credenciales inválidas' });
    const p = await resp.json();
    // emitir token para paciente
    const token = jwt.sign({ sub: p.id, email: p.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ message: 'Inicio de sesión exitoso', user: p, token });
  } catch (e) {
    console.error('[AUTH] log-in error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verificar email con código
app.post('/api/v1/auth/verify-email', async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const email = String(b.email || '');
    const code = String(b.verificationCode || '');
    if (!email || !code) return res.status(400).json({ error: 'Datos inválidos' });
    const found = await prisma.users.findUnique({ where: { email } });
    if (!found || !found.verificationCode || !found.verificationCodeExpires)
      return res.status(400).json({ error: 'Código inválido' });
    if (found.verificationCode !== code)
      return res.status(400).json({ error: 'Código inválido' });
    if (found.verificationCodeExpires.getTime() < Date.now())
      return res.status(400).json({ error: 'Código expirado' });

    const updated = await prisma.users.update({
      where: { email },
      data: { status: 'ACTIVE', verificationCode: null, verificationCodeExpires: null },
    });
    const authUser = {
      id: updated.id,
      email: updated.email,
      fullname: updated.fullname,
      status: updated.status,
      role: updated.role,
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
    const { email } = (req.body || {}) as { email?: string };
    if (!email) return res.status(400).json({ error: 'Datos inválidos' });
    // Confirma que el usuario exista
    const found = await prisma.users.findUnique({ where: { email } });
    if (!found) return res.status(404).json({ error: 'No encontrado' });
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.users.update({ where: { email }, data: { verificationCode, verificationCodeExpires } });
    const verifyUrl = `${FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;
    const r = await sendVerificationEmail(email, verificationCode, verifyUrl);
    if (r.previewUrl) console.log('[AUTH] Preview email URL:', r.previewUrl);
    return res.json({ message: 'Código reenviado' });
  } catch (e) {
    console.error('[AUTH] resend-verification-code error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Introspección de token y validación de roles
app.get('/api/v1/auth/verify-token', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = auth.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string };

    const id = payload?.sub || '';
    const email = payload?.email || '';
    let user = null as null | any;
    if (id) user = await prisma.users.findUnique({ where: { id } });
    if (!user && email) user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    if (user.status !== 'ACTIVE') return res.status(401).json({ error: 'email no verificado' });

    const allowedStr = String(req.query.allowedRoles || '').trim();
    if (allowedStr) {
      const allowed = allowedStr
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (allowed.length && !allowed.includes(String(user.role).toUpperCase())) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      status: user.status,
    };
    return res.json({ user: safeUser });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
app.post('/api/v1/auth/forgot-password', (_req, res) => {
  res.json({ message: 'Si el correo existe, se enviará un enlace' });
});

export default app;

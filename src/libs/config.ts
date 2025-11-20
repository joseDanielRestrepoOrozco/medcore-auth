import dotenv from 'dotenv';
dotenv.config();

<<<<<<< HEAD
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_SECURE = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';
export const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@medcore.local';
export const BRAND_NAME = process.env.BRAND_NAME || 'MedCore';
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const PATIENTS_SERVICE_URL = process.env.PATIENTS_SERVICE_URL || 'http://localhost:3003';
=======
export const PORT = process.env.PORT || '3000';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = process.env.SMTP_PORT || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SECRET = process.env.SECRET || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
>>>>>>> dev

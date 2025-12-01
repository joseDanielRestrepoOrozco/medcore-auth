import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || '3000';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = process.env.SMTP_PORT || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SECRET = process.env.SECRET || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const MAILHOG_URL = process.env.MAILHOG_URL || 'http://localhost:8025';
export const SMTP_SERVICE = process.env.SMTP_SERVICE;
export const SMTP_SECURE = process.env.SMTP_SECURE;
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
export const TEST_EMAIL = process.env.TEST_EMAIL;
export const EMAIL_ENABLED = process.env.EMAIL_ENABLED;

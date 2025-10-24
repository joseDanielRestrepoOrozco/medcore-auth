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

import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ?? 3000;
export const JWT_SECRET = (process.env.JWT_SECRET ?? process.env.SECRET ?? 'changeme').replace(/^"|"$/g, '');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

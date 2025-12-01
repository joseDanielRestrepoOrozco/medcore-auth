import { beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { MAILHOG_URL } from '../../src/libs/config';

export const prisma = new PrismaClient();
export const api = supertest(app);

export const setupAuthTests = () => {
  beforeEach(async () => {
    // Clear the users collection before each test
    await prisma.users.deleteMany({});
    // Limpiar mensajes de MailHog
    await fetch(`${MAILHOG_URL}/messages`, { method: 'DELETE' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
};

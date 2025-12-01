import { describe, test, beforeEach, expect } from 'vitest';
import { setupAuthTests, api } from './setup';
import { TEST_EMAIL } from '../../src/libs/config';
import getLastEmail from '../utils';

setupAuthTests();

describe('Login', () => {
  beforeEach(async () => {
    // Crear y verificar un usuario para las pruebas de login
    await api.post('/api/v1/auth/sign-up').send({
      email: TEST_EMAIL,
      current_password: '123456',
      fullname: 'Test User',
      documentNumber: '1234567890',
      date_of_birth: '2004-06-04',
      role: 'ADMINISTRADOR',
    });

    // Obtener código y verificar usuario
    const email = await getLastEmail();
    const match = email.Content.Body.match(
      /<!--\s*VERIFICATION_CODE:(\d{6})\s*-->/
    );
    const verificationCode = match ? match[1] : null;

    await api.post('/api/v1/auth/verify-email').send({
      email: TEST_EMAIL,
      verificationCode,
    });
  });

  test('should login with correct credentials', async () => {
    const response = await api
      .post('/api/v1/auth/log-in')
      .send({
        email: TEST_EMAIL,
        current_password: '123456',
      })
      .expect(200);

    expect(response.body.token).toBeTruthy();
    expect(response.body.user).toBeTruthy();
  });

  describe('Login validation errors', () => {
    test('should return 400 for invalid email format', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: 'invalid-email',
          current_password: '123456',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for password without numbers', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: TEST_EMAIL,
          current_password: 'abcdef',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing email field', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          currentPassword: '123456',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing password field', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: TEST_EMAIL,
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 401 for incorrect password', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: TEST_EMAIL,
          current_password: '654321',
        })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 401 for non-existent email', async () => {
      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: 'nonexistent@example.com',
          current_password: '123456',
        })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 401 for unverified user', async () => {
      // Crear un usuario sin verificar
      await api.post('/api/v1/auth/sign-up').send({
        email: 'unverified@example.com',
        current_password: '123456',
        fullname: 'Unverified User',
        documentNumber: '9876543210',
        date_of_birth: '2000-01-01',
        role: 'PACIENTE',
        paciente: {
          gender: 'M',
        },
      });

      const response = await api
        .post('/api/v1/auth/log-in')
        .send({
          email: 'unverified@example.com',
          current_password: '123456',
        })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });
  });
});

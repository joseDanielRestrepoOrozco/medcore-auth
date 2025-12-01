import { describe, test, beforeEach, expect } from 'vitest';
import { setupAuthTests, api } from './setup';
import { TEST_EMAIL } from '../../src/libs/config';
import getLastEmail from '../utils';

setupAuthTests();

describe('Resend Verification Code', () => {
  beforeEach(async () => {
    // Crear un usuario para las pruebas de reenvío
    await api.post('/api/v1/auth/sign-up').send({
      email: TEST_EMAIL,
      current_password: '123456',
      fullname: 'Test User',
      documentNumber: '1234567890',
      date_of_birth: '2004-06-04',
      role: 'ADMINISTRADOR',
    });
  });

  test('should resend verification code for existing unverified user', async () => {
    const response = await api
      .post('/api/v1/auth/resend-verification-code')
      .send({
        email: TEST_EMAIL,
      })
      .expect(200);

    expect(response.body.message).toBeTruthy();

    // Verificar que se envió un nuevo email
    const email = await getLastEmail();
    expect(email).toBeTruthy();
    const match = email.Content.Body.match(
      /<!--\s*VERIFICATION_CODE:(\d{6})\s*-->/
    );
    const verificationCode = match ? match[1] : null;
    expect(verificationCode).toBeTruthy();
  });

  describe('Resend verification code validation errors', () => {
    test('should return 400 for invalid email format', async () => {
      const response = await api
        .post('/api/v1/auth/resend-verification-code')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing email field', async () => {
      const response = await api
        .post('/api/v1/auth/resend-verification-code')
        .send({})
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for empty email', async () => {
      const response = await api
        .post('/api/v1/auth/resend-verification-code')
        .send({
          email: '',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for non-existent email', async () => {
      const response = await api
        .post('/api/v1/auth/resend-verification-code')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(404);

      expect(response.body.error).toBeTruthy();
    });
  });
});

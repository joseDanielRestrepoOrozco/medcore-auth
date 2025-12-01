import { describe, test, beforeEach, expect } from 'vitest';
import { setupAuthTests, api } from './setup';
import { TEST_EMAIL } from '../../src/libs/config';
import getLastEmail from '../utils';

setupAuthTests();

describe('Email Verification', () => {
  beforeEach(async () => {
    // Crear un usuario para las pruebas de verificación
    const response = await api.post('/api/v1/auth/sign-up').send({
      email: TEST_EMAIL,
      current_password: '123456',
      fullname: 'Test User',
      documentNumber: '1234567890',
      date_of_birth: '2004-06-04',
      role: 'ADMINISTRADOR',
    });

    console.log('Sign-up response:', response.body);
  });

  test('should verify email with correct code', async () => {
    // Obtener el código del email
    const email = await getLastEmail();
    const match = email.Content.Body.match(
      /<!--\s*VERIFICATION_CODE:(\d{6})\s*-->/
    );
    const verificationCode = match ? match[1] : null;

    const response = await api
      .post('/api/v1/auth/verify-email')
      .send({
        email: TEST_EMAIL,
        verificationCode,
      })
      .expect(200);

    expect(response.body.message).toBeTruthy();
  });

  describe('Email verification validation errors', () => {
    test('should return 400 for invalid email format', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          email: 'invalid-email',
          verificationCode: '123456',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for empty verification code', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          email: TEST_EMAIL,
          verificationCode: '',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for verification code too long', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          email: TEST_EMAIL,
          verificationCode: '1234567',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing email field', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          verificationCode: '123456',
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing verification code field', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          email: TEST_EMAIL,
        })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for incorrect verification code', async () => {
      const response = await api
        .post('/api/v1/auth/verify-email')
        .send({
          email: TEST_EMAIL,
          verificationCode: '000000',
        })
        .expect(400);

      console.log(response.body);

      expect(response.body.error).toBeTruthy();
    });
  });
});

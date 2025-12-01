import { describe, test, expect } from 'vitest';
import { setupAuthTests, api } from './setup';
import { TEST_EMAIL } from '../../src/libs/config';
import getLastEmail from '../utils';

setupAuthTests();

describe('Sign up', async () => {
  // caso exitoso
  test('should register a user successfully', async () => {
    const userData = {
      email: TEST_EMAIL,
      current_password: '123456',
      fullname: 'Test User',
      documentNumber: '1234567890',
      date_of_birth: '2004-06-04',
      role: 'ADMINISTRADOR',
    };

    const response = await api.post('/api/v1/auth/sign-up').send(userData);
    expect(response.body.email).toBe(userData.email);
    expect(response.body.fullname).toBe(userData.fullname);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.message).toBe(
      'Usuario creado. Código enviado al correo.'
    );

    const email = await getLastEmail();
    expect(email).toBeTruthy();

    const match = email.Content.Body.match(
      /<!--\s*VERIFICATION_CODE:(\d{6})\s*-->/
    );
    const verificationCode = match ? match[1] : null;
    expect(verificationCode).toBeTruthy();
  });

  // casos de matriz de errores

  describe('Email validation errors', () => {
    test('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        current_password: '123456',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for empty email', async () => {
      const userData = {
        email: '',
        current_password: '123456',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing email field', async () => {
      const userData = {
        current_password: '123456',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Password validation errors', () => {
    test('should return 400 for password without numbers', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: 'abcdef',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for password too short', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: '12',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing password field', async () => {
      const userData = {
        email: TEST_EMAIL,
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Fullname validation errors', () => {
    test('should return 400 for empty fullname', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: '123456',
        fullname: '',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for missing fullname field', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: '123456',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Role validation errors', () => {
    test('should return 400 for invalid role', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: '123456',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'INVALID_ROLE',
      };

      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('General validation errors', () => {
    test('should return 400 for completely empty body', async () => {
      const response = await api
        .post('/api/v1/auth/sign-up')
        .send({})
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await api
        .post('/api/v1/auth/sign-up')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      console.log(response.status);
    });

    test('should return 400 for duplicate email registration', async () => {
      const userData = {
        email: TEST_EMAIL,
        current_password: '123456',
        fullname: 'Test User',
        documentNumber: '1234567890',
        date_of_birth: '2004-06-04',
        role: 'ADMINISTRADOR',
      };

      // Primer registro - debe ser exitoso
      await api.post('/api/v1/auth/sign-up').send(userData).expect(201);

      // Segundo registro con el mismo email - debe fallar
      const response = await api
        .post('/api/v1/auth/sign-up')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });
});

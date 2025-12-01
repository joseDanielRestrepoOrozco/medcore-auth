import { describe, test, expect } from 'vitest';
import { setupAuthTests, api } from './setup';
import { TEST_EMAIL } from '../../src/libs/config';
import getLastEmail from '../utils';

setupAuthTests();

describe('Email', () => {
  test('User Registration - Successful Registration and Email Sent', async () => {
    const userData = {
      email: TEST_EMAIL,
      current_password: '123456',
      fullname: 'Test User',
      documentNumber: '1234567890',
      date_of_birth: '2004-06-04',
      role: 'ADMINISTRADOR',
    };

    const response = await api
      .post('/api/v1/auth/sign-up')
      .send(userData)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Verificar usuario creado
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
});

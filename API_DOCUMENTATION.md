# 📚 API Documentation - MedCore Auth Service

Documentación completa de los endpoints del microservicio de autenticación de MedCore.

**Base URL:** `http://localhost:PORT/api/v1/auth` (o tu dominio en producción)

---

## 📑 Tabla de Contenidos

- [1. Sign Up (Registro)](#1-sign-up-registro)
- [2. Log In (Inicio de sesión)](#2-log-in-inicio-de-sesión)
- [3. Verify Email](#3-verify-email)
- [4. Resend Verification Code](#4-resend-verification-code)
- [5. Verify Token](#5-verify-token)
- [Códigos de Estado HTTP](#códigos-de-estado-http)
- [Tipos de Roles](#tipos-de-roles)

---

## 1. Sign Up (Registro)

Registra un nuevo usuario en el sistema.

### Endpoint

```
POST /api/v1/auth/sign-up
```

### Headers

```
Content-Type: application/json
```

### Request Body

#### Campos Comunes (todos los roles)

| Campo              | Tipo   | Requerido | Descripción                                                |
| ------------------ | ------ | --------- | ---------------------------------------------------------- |
| `email`            | string | ✅        | Email válido                                               |
| `current_password` | string | ✅        | Mínimo 6 caracteres, debe contener al menos un número      |
| `fullname`         | string | ✅        | Nombre completo (solo letras y espacios)                   |
| `phone`            | string | ❌        | Teléfono de contacto                                       |
| `date_of_birth`    | string | ✅        | Fecha de nacimiento (formato ISO: YYYY-MM-DD)              |
| `gender`           | string | ❌        | Género                                                     |
| `role`             | string | ✅        | Uno de: `MEDICO`, `ENFERMERA`, `PACIENTE`, `ADMINISTRADOR` |

#### Campos adicionales por rol

**MEDICO:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `specialization` | string | ✅ | Especialización médica |
| `department` | string | ✅ | Departamento |
| `license_number` | string | ✅ | Número de licencia médica |

**ENFERMERA:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `department` | string | ✅ | Departamento |

**PACIENTE:** _(sin campos adicionales)_

**ADMINISTRADOR:** _(sin campos adicionales)_

### Ejemplos de Request

#### Paciente

```json
{
  "email": "paciente@example.com",
  "current_password": "password123",
  "fullname": "Juan Pérez",
  "phone": "+573001234567",
  "date_of_birth": "1990-05-15",
  "gender": "Masculino",
  "role": "PACIENTE"
}
```

#### Médico

```json
{
  "email": "doctor@example.com",
  "current_password": "securePass123",
  "fullname": "Dr. María González",
  "phone": "+573007654321",
  "date_of_birth": "1985-03-20",
  "role": "MEDICO",
  "specialization": "Cardiología",
  "department": "Medicina Interna",
  "license_number": "MED-12345"
}
```

### Response Success (201 Created)

```json
{
  "id": "6507f1b2e3d8a9c4b5a6e7f8",
  "email": "paciente@example.com",
  "fullname": "Juan Pérez",
  "status": "PENDING",
  "role": "PACIENTE",
  "message": "Usuario creado. Código enviado al correo."
}
```

### Response Errors

**400 Bad Request** - Usuario ya existe

```json
{
  "error": "User already exists"
}
```

**400 Bad Request** - Datos inválidos

```json
{
  "error": "Debe tener al menos 6 caracteres",
  "details": {
    "current_password": ["Debe tener al menos 6 caracteres"]
  }
}
```

**400 Bad Request** - Edad inválida

```json
{
  "error": "Invalid type: expected number but received string"
}
```

**500 Internal Server Error** - Error enviando email

```json
{
  "error": "Error sending verification email"
}
```

### Notas

- La edad debe estar entre 1 y 100 años
- Se envía automáticamente un código de verificación al email
- El código expira en 15 minutos
- El usuario se crea con status `PENDING` hasta verificar el email

---

## 2. Log In (Inicio de sesión)

Autentica un usuario y retorna un token JWT.

### Endpoint

```
POST /api/v1/auth/log-in
```

### Headers

```
Content-Type: application/json
```

### Request Body

| Campo              | Tipo   | Requerido | Descripción            |
| ------------------ | ------ | --------- | ---------------------- |
| `email`            | string | ✅        | Email registrado       |
| `current_password` | string | ✅        | Contraseña del usuario |

### Ejemplo de Request

```json
{
  "email": "paciente@example.com",
  "current_password": "password123"
}
```

### Response Success (200 OK)

```json
{
  "message": "Login exitoso",
  "user": {
    "id": "6507f1b2e3d8a9c4b5a6e7f8",
    "email": "paciente@example.com",
    "fullname": "Juan Pérez",
    "status": "ACTIVE",
    "role": "PACIENTE"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Errors

**401 Unauthorized** - Credenciales inválidas

```json
{
  "error": "Credenciales inválidas"
}
```

**401 Unauthorized** - Email no verificado

```json
{
  "error": "Email no verificado. Revisa tu correo."
}
```

**500 Internal Server Error** - Error de configuración

```json
{
  "error": "Error de configuración del servidor"
}
```

### Notas

- El token JWT expira en 24 horas
- El usuario debe tener status `ACTIVE` para poder iniciar sesión
- El token contiene: `userId`, `email`, `fullname`, `role`

---

## 3. Verify Email

Verifica el email del usuario usando el código enviado por correo.

### Endpoint

```
POST /api/v1/auth/verify-email
```

### Headers

```
Content-Type: application/json
```

### Request Body

| Campo              | Tipo   | Requerido | Descripción                            |
| ------------------ | ------ | --------- | -------------------------------------- |
| `email`            | string | ✅        | Email del usuario                      |
| `verificationCode` | string | ✅        | Código de 6 dígitos recibido por email |

### Ejemplo de Request

```json
{
  "email": "paciente@example.com",
  "verificationCode": "123456"
}
```

### Response Success (200 OK)

```json
{
  "message": "Email verificado exitosamente",
  "user": {
    "id": "6507f1b2e3d8a9c4b5a6e7f8",
    "email": "paciente@example.com",
    "fullname": "Juan Pérez",
    "status": "ACTIVE"
  }
}
```

### Response Errors

**404 Not Found** - Usuario no encontrado

```json
{
  "error": "Usuario no encontrado"
}
```

**400 Bad Request** - Usuario ya verificado

```json
{
  "error": "Usuario ya verificado"
}
```

**400 Bad Request** - Código inválido

```json
{
  "error": "Código de verificación inválido"
}
```

**400 Bad Request** - Código expirado

```json
{
  "error": "Código de verificación expirado"
}
```

### Notas

- El código tiene una validez de 15 minutos
- Una vez verificado, el status del usuario cambia a `ACTIVE`
- El código de verificación se elimina después de ser usado

---

## 4. Resend Verification Code

Reenvía el código de verificación al email del usuario.

### Endpoint

```
POST /api/v1/auth/resend-verification-code
```

### Headers

```
Content-Type: application/json
```

### Request Body

| Campo   | Tipo   | Requerido | Descripción       |
| ------- | ------ | --------- | ----------------- |
| `email` | string | ✅        | Email del usuario |

### Ejemplo de Request

```json
{
  "email": "paciente@example.com"
}
```

### Response Success (200 OK)

```json
{
  "message": "Código de verificación reenviado exitosamente"
}
```

### Response Errors

**404 Not Found** - Usuario no encontrado

```json
{
  "error": "Usuario no encontrado"
}
```

**400 Bad Request** - Usuario ya verificado

```json
{
  "error": "Usuario ya verificado"
}
```

**500 Internal Server Error** - Error enviando email

```json
{
  "error": "Error enviando código de verificación"
}
```

### Notas

- Genera un nuevo código de 6 dígitos
- El nuevo código también expira en 15 minutos
- El código anterior se invalida automáticamente

---

## 5. Verify Token

Valida un token JWT y verifica permisos basados en roles. Este endpoint es usado principalmente por otros microservicios.

### Endpoint

```
GET /api/v1/auth/verify-token
```

### Headers

```
Authorization: Bearer <token>
```

### Query Parameters (Opcionales)

| Parámetro      | Tipo   | Descripción                                                               |
| -------------- | ------ | ------------------------------------------------------------------------- |
| `requiredRole` | string | Verifica que el usuario tenga exactamente este rol                        |
| `allowedRoles` | string | Lista de roles permitidos separados por coma (ej: `MEDICO,ADMINISTRADOR`) |

### Ejemplos de Request

#### Sin verificación de roles

```bash
GET /api/v1/auth/verify-token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Con rol requerido

```bash
GET /api/v1/auth/verify-token?requiredRole=MEDICO
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Con múltiples roles permitidos

```bash
GET /api/v1/auth/verify-token?allowedRoles=MEDICO,ADMINISTRADOR
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Success (200 OK)

```json
{
  "valid": true,
  "user": {
    "id": "6507f1b2e3d8a9c4b5a6e7f8",
    "email": "doctor@example.com",
    "fullname": "Dr. María González",
    "role": "MEDICO",
    "status": "ACTIVE",
    "specialization": "Cardiología",
    "department": "Medicina Interna",
    "license_number": "MED-12345"
  }
}
```

### Response Errors

**401 Unauthorized** - Token no proporcionado

```json
{
  "error": "No token provided"
}
```

**401 Unauthorized** - Token inválido

```json
{
  "error": "token no valido"
}
```

**401 Unauthorized** - Token expirado

```json
{
  "error": "token expirado"
}
```

**403 Forbidden** - Permisos insuficientes (rol específico)

```json
{
  "error": "Permisos insuficientes",
  "required": "MEDICO",
  "current": "PACIENTE"
}
```

**403 Forbidden** - Permisos insuficientes (múltiples roles)

```json
{
  "error": "Permisos insuficientes",
  "allowed": ["MEDICO", "ADMINISTRADOR"],
  "current": "PACIENTE"
}
```

**403 Forbidden** - Usuario no activo

```json
{
  "error": "Cuenta de usuario no está activa"
}
```

**404 Not Found** - Usuario no encontrado

```json
{
  "error": "Usuario no encontrado"
}
```

### Notas

- El token debe enviarse en el header `Authorization` con el formato `Bearer <token>`
- La información del usuario se obtiene de la base de datos, no del token
- Esto permite revocación implícita: si un usuario es desactivado, sus tokens dejan de funcionar
- El rol se verifica contra la base de datos para prevenir manipulación del token

---

## Códigos de Estado HTTP

| Código | Significado           | Cuándo se usa                                         |
| ------ | --------------------- | ----------------------------------------------------- |
| 200    | OK                    | Operación exitosa (login, verify-email, verify-token) |
| 201    | Created               | Usuario creado exitosamente                           |
| 400    | Bad Request           | Datos inválidos o reglas de negocio no cumplidas      |
| 401    | Unauthorized          | Credenciales inválidas o token faltante/inválido      |
| 403    | Forbidden             | Token válido pero sin permisos suficientes            |
| 404    | Not Found             | Recurso no encontrado (usuario)                       |
| 500    | Internal Server Error | Error del servidor o configuración                    |

---

## Tipos de Roles

| Rol             | Descripción                 | Campos Adicionales                         |
| --------------- | --------------------------- | ------------------------------------------ |
| `PACIENTE`      | Pacientes del sistema       | Ninguno                                    |
| `MEDICO`        | Médicos                     | specialization, department, license_number |
| `ENFERMERA`     | Enfermeras                  | department                                 |
| `ADMINISTRADOR` | Administradores del sistema | Ninguno                                    |

---

## Validaciones Generales

### Email

- Debe ser un email válido
- Único en el sistema

### Contraseña (current_password)

- Mínimo 6 caracteres
- Debe contener al menos un número

### Nombre completo (fullname)

- Solo letras (incluyendo acentos y ñ) y espacios
- No puede estar vacío

### Fecha de nacimiento (date_of_birth)

- Formato ISO 8601: `YYYY-MM-DD`
- La edad calculada debe estar entre 1 y 100 años

### Código de verificación

- Exactamente 6 dígitos numéricos
- Válido por 15 minutos

---

## Seguridad

### Tokens JWT

- Algoritmo: HS256
- Expiración: 24 horas
- Contiene: userId, email, fullname, role

### Contraseñas

- Hasheadas con bcrypt (10 rounds)
- Nunca se retornan en las respuestas

### Verificación de Email

- Obligatoria para activar la cuenta
- Códigos de un solo uso
- Expiración automática

### Validación de Roles

- Verificada contra la base de datos
- No se confía únicamente en el token JWT
- Permite revocación de permisos en tiempo real

---

## Ejemplos de Uso con cURL

### Sign Up

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "current_password": "password123",
    "fullname": "Test User",
    "date_of_birth": "1990-01-01",
    "role": "PACIENTE"
  }'
```

### Log In

```bash
curl -X POST http://localhost:3000/api/v1/auth/log-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "current_password": "password123"
  }'
```

### Verify Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verificationCode": "123456"
  }'
```

### Verify Token

```bash
curl -X GET http://localhost:3000/api/v1/auth/verify-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Verify Token con rol requerido

```bash
curl -X GET "http://localhost:3000/api/v1/auth/verify-token?requiredRole=MEDICO" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Flujo de Autenticación Completo

```
1. Usuario se registra (POST /sign-up)
   ↓
2. Sistema envía código de verificación por email
   ↓
3. Usuario verifica email (POST /verify-email)
   ↓
4. Status cambia a ACTIVE
   ↓
5. Usuario inicia sesión (POST /log-in)
   ↓
6. Sistema retorna JWT token
   ↓
7. Usuario usa token en requests subsecuentes
   ↓
8. Otros microservicios validan token (GET /verify-token)
```

---

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo de MedCore.

**Versión:** 1.0.0  
**Última actualización:** 21 de octubre de 2025

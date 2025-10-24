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

# 📚 Documentación de la API — Microservicio Auth

Esta documentación describe los endpoints y modelos del microservicio de autenticación adaptado a la nueva arquitectura con MongoDB y tipos compuestos (composite types) en Prisma.

Base URL (local): http://localhost:<PORT>/api

Rutas principales del servicio:

- /api/auth — endpoints de autenticación
- /api/departamentos — gestión de departamentos
- /api/especialidades — gestión de especialidades

---

## Índice

- Modelos y tipos
- Endpoints de Auth
- Endpoints de Departamentos
- Endpoints de Especialidades
- Ejemplos de payloads
- Validaciones y notas

---

## Modelos y tipos (resumen)

Prisma (MongoDB) usa tipos compuestos para datos específicos por rol. A continuación el resumen de los modelos relevantes:

- Departamento

  - id (ObjectId)
  - nombre (string, único)
  - descripcion (string?)
  - especialidades (relación 1:N)

- Especialidad

  - id (ObjectId)
  - nombre (string, único)
  - descripcion (string?)
  - departamentoId (ObjectId) -> Departamento

- Users (colección principal)
  - id (ObjectId)
  - email (string, único)
  - current_password (string - hashed)
  - fullname (string)
  - role (enum: MEDICO | ENFERMERA | PACIENTE | ADMINISTRADOR)
  - date_of_birth (DateTime)
  - age (Int)
  - phone (string?)
  - gender (string?)
  - status (enum: PENDING | ACTIVE | INACTIVE)
  - verificationCode (string?)
  - verificationCodeExpires (DateTime?)
  - medico (DatosMedico?) — tipo compuesto
  - enfermera (DatosEnfermera?) — tipo compuesto
  - paciente (DatosPaciente?) — tipo compuesto
  - administrador (DatosAdministrador?) — tipo compuesto

Tipos compuestos relevantes:

- DatosMedico

  - especialidadId (ObjectId) — referencia a `Especialidad`
  - licenciaMedica (string)

- DatosEnfermera

  - departamentoId (ObjectId) — referencia a `Departamento`

- DatosPaciente

  - grupoSanguineo (string?)
  - alergias (string[])
  - contactoEmergencia (string?)

- DatosAdministrador
  - nivelAcceso (string?)
  - departamentoAsignado (string?)

---

## Endpoints — Autenticación

Todas las rutas de auth están bajo `/api/auth`.

1. Registro (Sign Up)

POST /api/auth/sign-up

Headers: Content-Type: application/json

Payload base (común para todos):

{
"email": "string",
"current_password": "string",
"fullname": "string",
"date_of_birth": "YYYY-MM-DD",
"role": "MEDICO|ENFERMERA|PACIENTE|ADMINISTRADOR",
"phone": "string (opcional)",
"gender": "string (opcional)"
}

Payloads por rol (ejemplos):

- Médico

{
"role": "MEDICO",
"medico": {
"especialidadId": "<ObjectId de Especialidad>",
"licenciaMedica": "MED-12345"
}
}

- Enfermera

{
"role": "ENFERMERA",
"enfermera": {
"departamentoId": "<ObjectId de Departamento>"
}
}

- Paciente (opcionalmente con datos)

{
"role": "PACIENTE",
"paciente": {
"grupoSanguineo": "O+",
"alergias": ["Penicilina"],
"contactoEmergencia": "+573001112233"
}
}

- Administrador (opcionalmente con datos)

{
"role": "ADMINISTRADOR",
"administrador": {
"nivelAcceso": "TOTAL",
"departamentoAsignado": "Sistemas"
}
}

Respuestas:

- 201 Created: usuario creado (status PENDING). Se envía código de verificación por email.
- 400 Bad Request: datos inválidos o referencias inexistentes (especialidad/departamento no existe).

Validaciones importantes durante signup:

- Si role = MEDICO: `medico.especialidadId` debe existir en `Especialidad`.
- Si role = ENFERMERA: `enfermera.departamentoId` debe existir en `Departamento`.
- Email único y contraseña con al menos 6 caracteres y un número.

2. Log In

POST /api/auth/log-in

Body: { email, current_password }

Respuesta 200: token JWT + usuario (sin contraseña).

3. Verify Email

POST /api/auth/verify-email

Body: { email, verificationCode }

Acción: cambia `status` a `ACTIVE` si el código coincide y no ha expirado.

4. Resend Verification Code

POST /api/auth/resend-verification-code

Body: { email }

5. Verify Token

GET /api/auth/verify-token
Headers: Authorization: Bearer <token>

Opcional: parámetros para verificar roles (por ejemplo allowedRoles).

---

## Endpoints — Departamentos

Todas las rutas bajo `/api/departamentos`.

- POST /api/departamentos — crear departamento

  - Body: { nombre: string, descripcion?: string }
  - Respuesta 201: departamento creado

- GET /api/departamentos — listar todos (incluye especialidades)

- GET /api/departamentos/:id — obtener por id (incluye especialidades)

- PUT /api/departamentos/:id — actualizar (nombre, descripcion)

- DELETE /api/departamentos/:id — elimina (fallará si hay especialidades asociadas)

Notas:

- `nombre` debe ser único.
- No eliminar departamento con especialidades asociadas.

---

## Endpoints — Especialidades

Todas las rutas bajo `/api/especialidades`.

- POST /api/especialidades — crear especialidad

  - Body: { nombre: string, descripcion?: string, departamentoId: string }
  - Verifica que `departamentoId` exista.

- GET /api/especialidades — listar todas (incluye departamento)

- GET /api/especialidades/departamento/:departamentoId — especialidades por departamento

- GET /api/especialidades/:id — obtener por id

- PUT /api/especialidades/:id — actualizar

- DELETE /api/especialidades/:id — eliminar

Validación:

- `nombre` único; `departamentoId` debe existir.

---

## Ejemplos de payloads y uso (cURL)

1. Crear departamento

```bash
curl -X POST http://localhost:3000/api/departamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"nombre":"Medicina Interna","descripcion":"..."}'
```

2. Crear especialidad

```bash
curl -X POST http://localhost:3000/api/especialidades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"nombre":"Cardiología","departamentoId":"<DEPT_ID>"}'
```

3. Registrar médico (ejemplo minimal)

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email":"doctor.perez@hospital.com",
    "current_password":"Doctor123",
    "fullname":"Dr. Juan Pérez",
    "date_of_birth":"1985-05-15",
    "role":"MEDICO",
    "medico": {"especialidadId":"<ESPECIALIDAD_ID>", "licenciaMedica":"MED-12345"}
  }'
```

4. Registrar enfermera

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email":"enfermera@hospital.com",
    "current_password":"Enfermera123",
    "fullname":"María González",
    "date_of_birth":"1992-08-20",
    "role":"ENFERMERA",
    "enfermera": {"departamentoId":"<DEPARTAMENTO_ID>"}
  }'
```

5. Registrar paciente (simple)

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email":"paciente@ejemplo.com",
    "current_password":"Paciente123",
    "fullname":"Carlos R",
    "date_of_birth":"1995-03-10",
    "role":"PACIENTE"
  }'
```

---

## Validaciones y notas importantes

- Email único.
- Password: mínimo 6 caracteres y al menos un número.
- `medico.especialidadId` debe existir; `enfermera.departamentoId` debe existir.
- Edad calculada entre 1 y 100 años.
- El registro crea al usuario con `status = PENDING` y envía un código de verificación (15 minutos de validez).

## Comandos útiles (Prisma)

Para regenerar el cliente y aplicar cambios en el esquema:

```bash
cd auth
npx prisma generate
npx prisma db push
```

---

## Resumen rápido de campos por rol

- Médico: `medico.especialidadId` (ObjectId), `medico.licenciaMedica` (string)
- Enfermera: `enfermera.departamentoId` (ObjectId)
- Paciente: `paciente` (opcional: `grupoSanguineo`, `alergias`, `contactoEmergencia`)
- Administrador: `administrador` (opcional: `nivelAcceso`, `departamentoAsignado`)

---

Si quieres, puedo generar también un seed script completo que cree departamentos, especialidades y usuarios de ejemplo para probar localmente.

Última actualización: 24 de octubre de 2025

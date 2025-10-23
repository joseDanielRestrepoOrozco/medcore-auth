# Uso del Endpoint `verifyToken`

Este endpoint valida el JWT y verifica permisos basados en roles.

## Endpoint

```
GET /auth/verify-token
```

## Headers Requeridos

### 2. `allowedRoles` - Verificar múltiples roles permitidos

Verifica que el usuario tenga uno de los roles en la lista (separados por coma).

**Ejemplo:**

```bash
GET /auth/verify-token?allowedRoles=MEDICO,ADMINISTRADOR
```

**Respuesta exitosa (200):**

```json
{
  "valid": true,
  "user": {
    "id": "456def",
    "fullname": "María González",
    "role": "ADMINISTRADOR",
    "status": "ACTIVE"
  }
}
```

**Respuesta de error (403):**

```json
{
  "valid": false,
  "error": "Permisos insuficientes"
}
```

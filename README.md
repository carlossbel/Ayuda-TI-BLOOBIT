# Ayuda TI

Portal de tickets con React + Vite + Firebase (Firestore + Auth anónima).

## Configuración de Firebase (una sola vez)

1. **Registrar app web**: Consola Firebase → ⚙️ Configuración del proyecto → *Tus apps* → `</>` (Web). Copia los valores de `firebaseConfig` al archivo `.env`.
2. **Authentication** → *Método de acceso* → habilita **Anónimo**.
3. **Firestore Database** → *Reglas* → pega el contenido de `firestore.rules` y publica.
4. En `.env` cambia `VITE_ADMIN_PIN` por el PIN que quieras para el usuario administrador (Carlos Beltran).

## Correr

```bash
npm install
npm run dev
```

## Estructura de datos (Firestore)

| Colección | Contenido |
|---|---|
| `users/{id}` | nombre, departamento, rol, último acceso |
| `tickets/{número}` | folio, asunto, categoría, prioridad, descripción, estatus, solicitante, historial |
| `tickets/{número}/attachments/{n}` | capturas comprimidas (base64) |
| `meta/counters` | consecutivo de folios |

## Estatus

| Estatus | Imagen |
|---|---|
| Se recibió tu solicitud | 2 |
| Procesando tu solicitud | 3 |
| Trabajando en tu solicitud | 4 |
| Solicitud casi terminada | 5 |
| Tu solicitud no tiene solución, requiero más tiempo | 7 |
| Ticket resuelto | 6 (visible 72 h en Estado y siempre en Finalizadas) |

Los usuarios se editan en `src/data/users.js`.

## Notificaciones push

- A TI le llega un aviso por cada ticket nuevo; al usuario, cada vez que cambia el estatus de su ticket.
- Cada persona toca **Activar** en el aviso del portal y acepta el permiso del navegador (una vez por teléfono).
- Envío: función `api/notify.js` en Vercel con Firebase Cloud Messaging. Solo funciona en Vercel, no con `npm run dev`.

Variables necesarias en Vercel:

| Variable | De dónde sale | Tipo |
|---|---|---|
| `VITE_FIREBASE_VAPID_KEY` | Firebase → Configuración del proyecto → Cloud Messaging → Certificados push web → Generar par de claves | Config |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada (pegar el JSON completo) | Secret |

# Tránsito · Control de acceso vehicular con QR

App mobile-first (Next.js App Router + Supabase) para registrar entradas y salidas de vehículos escaneando un código QR.

- **Estado** (`/`): Kanban "En Lugar / Ausentes" (pestañas deslizables en móvil, dos columnas en tablet/PC), en tiempo real. Es la pantalla de inicio.
- **Escanear** (`/escanear`): cámara + búsqueda manual por placa; Bottom Sheet con foto, nombres y botones "Registrar Entrada / Salida".
- **Afiliados** (`/afiliados`): alta por pasos (tipo, foto, vehículos) y QR descargable por vehículo.
- **Informes** (`/informes`): movimientos agrupados por día con filtro de fechas.

## Configuración

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `.env.local.example` a `.env.local` y completa los valores (Project Settings → API / Database).
3. Crea las tablas, la vista, el bucket `owner-photos` y las políticas:

   ```bash
   npm run db:setup
   ```

   El script ([scripts/db-setup.sh](scripts/db-setup.sh)) lee `.env.local` y ejecuta `supabase db push` contra el pooler de sesión (IPv4) usando la contraseña de la base.
   Alternativa manual: pega `supabase/migrations/20261015000000_init.sql` en el SQL Editor del panel.

## Desarrollo

```bash
npm install
npm run dev
```

La cámara solo funciona en `localhost` o bajo HTTPS. Para probar desde el celular en la misma red:

```bash
npx next dev --experimental-https -H 0.0.0.0
```

y abre `https://<ip-de-tu-pc>:3000` aceptando el certificado.

## Notas

- Login con correo y contraseña (Supabase Auth). Cualquiera puede registrarse y todos los usuarios tienen el mismo acceso; sin sesión, las políticas RLS bloquean lectura y escritura.
- La app no pide confirmar el correo. Aunque **Confirm email** siga activo en el panel de Supabase, un trigger marca el correo como confirmado al crear la cuenta y el usuario entra directo.
- Cada vehículo tiene un `qr_code_hash` único (16 caracteres); el QR codifica solo ese valor.

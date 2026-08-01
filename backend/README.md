# hakIA backend

Scaffold API-first para iniciar el backend de hakIA con Next.js, TypeScript, Prisma/PostgreSQL, Groq y `whatsapp-web.js`.

## Alcance actual

- Solo API: no hay páginas, layouts ni componentes de UI.
- `src/lib`: configuración de entorno y cliente Prisma lazy.
- `src/integrations/groq`: contrato y adaptador stub; no realiza llamadas a Groq.
- `src/integrations/whatsapp`: contrato y adaptador stub; no inicia `whatsapp-web.js`.
- `src/app/api/health`: endpoint local `GET /api/health`.
- `prisma/schema.prisma`: datasource PostgreSQL y generador Prisma, sin tablas de dominio intencionalmente.

Los nombres y límites siguen las specs en `../docs/specs/`. Esta base no implementa todavía catálogo, campañas, Q&A, autenticación, consentimiento, opiniones ni UI. Las opiniones futuras deberán tratarse como participación ciudadana no vinculante, nunca como voto legislativo oficial. Tampoco se introduce RAG en esta etapa.

## Arranque local

Requisitos: Node.js 20.9+ y PostgreSQL accesible cuando se empiece a usar Prisma.

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Luego se puede comprobar `http://localhost:3000/api/health`.

`npm install` no forma parte de este scaffold ni se ejecuta automáticamente. El endpoint de salud no abre conexiones a PostgreSQL y no requiere credenciales.

## Prisma

El schema no crea modelos aún para evitar inventar el dominio antes de definir la primera rebanada funcional. Cuando se defina una entidad inicial, agregarla explícitamente a `prisma/schema.prisma`, revisar las specs y crear una migración con credenciales locales.

## Integraciones

Los adaptadores exponen contratos tipados y estado `stub`. Sus métodos lanzan un error explícito si se invocan; esto evita presentar como funcional una integración que todavía no tiene manejo de sesiones, errores, límites, privacidad ni persistencia. La dependencia `whatsapp-web.js` está externalizada en `next.config.ts` para el futuro runtime Node, pero no se importa ni se inicia durante este scaffold.

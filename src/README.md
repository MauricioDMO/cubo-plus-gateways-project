This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker Compose

Requisitos: Docker Engine y Docker Compose v2 o superior. Ejecuta los comandos desde `src/`.
Los archivos son independientes: no combines desarrollo y producción con varios `-f`.

### Desarrollo

```bash
docker compose -f compose.dev.yaml up --build
```

- Aplicación con recarga automática: http://localhost:3000.
- PostgreSQL 18: `localhost:5432`, base y usuario `gateways`, contraseña `gateways_dev`.
- Opcionalmente copia `.env.example` a `.env` para cambiar credenciales o puertos.
- Las dependencias se sincronizan al arrancar; reinicia `app` si cambias `package.json` o el lockfile.
- Para levantar solo PostgreSQL: `docker compose -f compose.dev.yaml up -d db`.

### Despliegue

```bash
cp .env.example .env
openssl rand -hex 32
# Guarda la contraseña generada en POSTGRES_PASSWORD dentro de .env.
docker compose -f compose.prod.yaml up -d --build --wait
```

La contraseña es obligatoria y no se incluye en la imagen. Usa valores seguros para URL
(por ejemplo, hexadecimales) en usuario y contraseña porque forman parte de `DATABASE_URL`.
La imagen usa la salida standalone de Next.js y ejecuta la aplicación sin root.
PostgreSQL no publica puertos en producción; solo es accesible en la red de Compose.
Configura HTTPS en el proxy inverso o plataforma de despliegue antes de exponer el sitio a Internet.
La compilación requiere Internet para descargar dependencias y las fuentes de Google de `next/font`.

### Datos y comprobación

Ambos entornos esperan a que PostgreSQL esté listo y usan volúmenes separados.
`DATABASE_URL` queda disponible en el servidor de Next.js con host `db`;
todavía no hay cliente de base de datos, esquema ni migraciones en esta aplicación.

```bash
docker compose -f compose.dev.yaml config --quiet
docker compose -f compose.prod.yaml config --quiet # Requiere POSTGRES_PASSWORD.
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f app
docker compose -f compose.prod.yaml exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1"'
```

Para detener sin borrar datos: `docker compose -f compose.prod.yaml down`
(usa `compose.dev.yaml` para desarrollo). **No añadas `-v`: elimina los datos persistentes.**
Cambiar las credenciales en `.env` no modifica una base ya inicializada: rótalas con SQL.
Los volúmenes no sustituyen las copias de seguridad; programa backups antes del despliegue real.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

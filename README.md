# LimaBlocks

Django REST backend (`lima-backend`) and Create React App frontend
(`lima-frontend-js`), run together with Docker Compose.

## Configuration

All ports, hostnames, credentials and secrets live in a **`.env` file at the
repo root**. Nothing configurable is hardcoded in `settings.py`,
`docker-compose.yml` or the Dockerfiles.

```sh
cp .env.example .env
# then edit .env — at minimum set DJANGO_SECRET_KEY
```

`.env` is git-ignored. `.env.example` is the committed reference and documents
every variable together with its default.

Three consumers read the same file:

| Consumer | How it reads `.env` |
| --- | --- |
| Docker Compose | automatically, both for `${VAR}` substitution in `docker-compose.yml` and via `env_file:` for the `api` container |
| Django | `limaBackend/settings.py` loads it with `python-dotenv`, so `python manage.py …` outside Docker sees the same values |
| React dev server | Compose passes `REACT_APP_*` and `PORT` into the `web` container |

Real environment variables always win over the file, so
`DJANGO_SECRET_KEY=… docker compose up` or a CI secret store overrides it
without any code change.

### Changing a port

Set `BACKEND_PORT` / `FRONTEND_PORT` in `.env`. Each one drives the container's
listening port, the published host port, the healthcheck and the CORS origin at
the same time — there is no second place to update.

### Running the frontend outside Docker

`npm start` only reads a `.env` in `lima-frontend-js/`, not the repo root, so
that folder has its own template:

```sh
cd lima-frontend-js
cp .env.example .env
npm start
```

Keep its values in sync with the root file. Note that **only `REACT_APP_*`
names reach the browser bundle, and they ship in cleartext** — never put a
secret in one.

## Running

```sh
docker compose up --build
```

- frontend: `http://localhost:3000` (`FRONTEND_PORT`)
- API: `http://localhost:8000/api/` (`BACKEND_PORT`)

## Secrets

- `.env`, `.env.local` and `.env.*.local` are git-ignored, and both
  `.dockerignore` files exclude them so nothing is baked into an image.
- `DJANGO_SECRET_KEY` is required whenever `DJANGO_DEBUG` is off; under DEBUG a
  throwaway key is generated per process so a fresh clone starts with no setup.
- Wrap values containing `$` in single quotes — otherwise Compose and
  python-dotenv both read them as variable references.

# agrosurinovo

Site institucional com catálogo, página de detalhe, cadastro e login com autenticação JWT própria usando Supabase apenas como banco Postgres.

Projeto independente da AGRO SURI, publicado em [www.agrosuriveiculosemaquinas.com.br](https://www.agrosuriveiculosemaquinas.com.br/).

## Stack

- HTML, CSS e JavaScript
- Node.js + Express
- JWT próprio
- Supabase Postgres
- Vercel para frontend + funções `api/`

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie seu arquivo local:

```bash
cp .env.example .env
```

3. Preencha o `.env`

4. Inicie:

```bash
npm start
```

5. Acesse:

- `http://localhost:3000`

## Banco no Supabase

Para migrar todos os dados, siga o guia privado `COMO-RESTAURAR-SUPABASE.md` desta cópia. Os backups e dados de clientes não fazem parte do repositório público. Para uma instalação vazia, execute o SQL abaixo no `SQL Editor` do Supabase:

- [supabase/001_init.sql](./supabase/001_init.sql)

Esse script cria:

- `public.app_users`
- `public.app_refresh_tokens`

Consulta rápida:

- [sql/check_profiles.sql](./sql/check_profiles.sql)

## Variáveis de ambiente

Base local:

- [`.env.example`](./.env.example)

Variáveis usadas:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `BCRYPT_ROUNDS`
- `APP_ENV`
- `PORT`
- `APP_URL`
- `APP_DOMAIN`
- `CORS_ORIGIN`

## Publicação

O ambiente de produção está publicado no Vercel com domínio próprio e HTTPS. Integrações de pagamento e webhooks permanecem sem credenciais até que sejam fornecidas configurações próprias da AGRO SURI. O arquivo `.env`, os backups e os documentos privados não são versionados.

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente. Não existe senha administrativa padrão no código.

## APIs disponíveis

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

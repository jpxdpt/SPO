# SPO Gestão — Serviços de Psicologia e Orientação

Aplicação web interna da escola (monólito Next.js). **Não é portal público nem sistema de emergência.**

## Stack

Next.js 16 + TypeScript + Tailwind + Auth.js v5 + Drizzle + PostgreSQL 16 em Docker.
Não depende de Supabase, Neon ou Vercel para funcionar.

## Desenvolvimento com Docker

```bash
cp .env.example .env
# Editar POSTGRES_PASSWORD, AUTH_SECRET e INITIAL_PSYCHOLOGIST_PASSWORD.
docker compose up --build
```

O acesso fica em `http://localhost:18473` por defeito. A porta pode ser alterada com `APP_PORT`.
O container aplica todas as migrações e executa o seed fictício apenas quando `profiles` está vazia.

## Deployment numa VPS

1. Clonar o repositório:
   ```bash
   git clone https://github.com/jpxdpt/SPO.git
   cd SPO
   ```
2. Criar o ambiente privado:
   ```bash
   cp .env.example .env
   chmod 600 .env
   ```
3. Definir no `.env`:
   - `POSTGRES_PASSWORD`: password forte da BD;
   - `AUTH_SECRET`: `openssl rand -base64 32`;
   - `INITIAL_PSYCHOLOGIST_PASSWORD`: password inicial da psicóloga;
   - `APP_PORT`: porta HTTP externa, por defeito `18473`.
4. Iniciar:
   ```bash
   docker compose up -d --build
   docker compose logs -f app
   ```
5. Abrir `http://IP_DA_VPS:18473`. A BD fica apenas em `127.0.0.1:15432` e não deve ser publicada na Internet.

Para atualizar:

```bash
git pull --ff-only
```

Para backup:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U spo -d spo | gzip > backups/spo-$(date +%F).sql.gz
```

As migrations são idempotentes. O seed só corre numa base vazia; backups/restauros devem ser testados antes de produção.

## Bootstrap de utilizadores

`INITIAL_PSYCHOLOGIST_EMAIL` e `INITIAL_PSYCHOLOGIST_PASSWORD` configuram a conta inicial. A psicóloga SPO pode criar os restantes perfis em `/settings`; as passwords são guardadas com bcrypt. O seed cria apenas a psicóloga por defeito. Defina `SEED_DEMO_USERS=true` apenas numa base de demonstração para criar os perfis fictícios adicionais. Remover a variável de bootstrap depois de confirmar o acesso e usar a gestão normal de utilizadores.

## Verificações

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e
```

## Segurança

RBAC no servidor + RLS no PostgreSQL; docentes veem apenas alunos das suas turmas e as próprias sinalizações em estado seguro; casos/notas/documentos só SPO; notas clínicas cifradas; auditoria de ações sensíveis; uploads privados ≤10 MB; sem conteúdo sensível em logs/emails/notificações. Rever `docs/seguranca.md` com a direção e o EPD antes de dados reais.

## Por fazer (Fase 3+)

Avaliações, intervenções em turma, contactos/reuniões, PAA, recursos/modelos, relatórios CSV/PDF, MFA TOTP, proxy HTTPS reverso, backups automatizados, AIPD/EPD e piloto.

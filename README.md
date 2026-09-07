# SPO Gestão — Serviços de Psicologia e Orientação

Aplicação web interna da escola (monólito Next.js). **Não é portal público nem sistema de emergência.**

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (primitivas em `components/ui`) +
React Hook Form + Zod + Recharts + Auth.js v5 + Drizzle + Postgres **Neon.tech** (sem Supabase).
Testes: Vitest (unit/integração) + Playwright (E2E).

## Início rápido (sem BD — modo estrutura)

```bash
pnpm install
cp .env.example .env.local
pnpm dev      # http://localhost:3000 → /dashboard → /login
```

Sem `DATABASE_URL`, a app arranca com avisos e contas demo (só dev, palavra-passe `demo`):
`psicologa@escola-demo.pt` (Psicólogo SPO) · `orientador@escola-demo.pt` (Orientador) ·
`dt@escola-demo.pt` (Professor) · `admin@escola-demo.pt` (Administrador técnico, sem acesso clínico).

## Ligar o Neon (quando tiveres o URL)

1. Criar projeto Neon na **UE** com 2 branches: `dev` e `prod`.
2. `DATABASE_URL="postgresql://…@ep-….eu-central-1.aws.neon.tech/spo_dev?sslmode=require"` no `.env.local` (dev) e nas env vars da Vercel (prod).
3. Aplicar schema + RLS e seed **fictício**:
   ```bash
   psql $DATABASE_URL -f db/migrations/0001_init.sql -f db/migrations/0002_roles.sql
   pnpm db:seed
   ```
4. Definir `AUTH_SECRET` (gerar com `openssl rand -base64 32`) e `APP_ENCRYPTION_KEY` (32 bytes base64).

## Verificações

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e   # requer pnpm dev a correr
```

## Estrutura

`app/(auth)/login` · `app/(app)/{dashboard,students,referrals,cases,calendar,tasks,settings}` ·
`app/api/{health,auth}` · `components/ui` · `lib/{db,session,permissions,validation,audit,encryption,files,dates,data}` ·
`db/{schema.ts,migrations/0001_init.sql,seed.ts}` · `tests/{unit,integration,e2e}` · `docs/seguranca.md`

## Segurança (resumo)

RBAC no servidor + RLS no Neon (fail-closed); diretor só vê alunos das suas turmas e as próprias sinalizações em estado seguro; casos/notas/documentos só SPO; notas clínicas cifradas (AES-256-GCM); auditoria de ações sensíveis; uploads privados ≤10 MB com allowlist; sem conteúdo sensível em logs/emails/notificações. Detalhe em `docs/seguranca.md`.

## Por fazer (Fase 3+)

Avaliações, intervenções em turma, contactos/reuniões, PAA, recursos/modelos, relatórios CSV/PDF com supressão <5, MFA TOTP, Vercel Blob privado, Entra ID/OIDC, AIPD/EPD e piloto. Nada disto recebe dados reais antes da aprovação da direção/SPO/EPD.

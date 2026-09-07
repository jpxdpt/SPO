# Segurança e proteção de dados — SPO Gestão

> Rever com o EPD/DPO e a direção antes de qualquer dado real. Sem AIPD aprovada (se aplicável), sem produção com menores.

## Decisões tomadas

1. **Sem Supabase**: Postgres Neon (UE) + Auth.js v5 + Vercel Blob. Menos superfície (sem `service_role` no browser), mas a app assume MFA, expiração de sessão (8h) e revogação por `profiles.active`.
2. **4 perfis** (`db/migrations/0002_roles.sql`): `SPO_PSYCHOLOGIST` (todo o trabalho clínico e operacional, sem gestão técnica), `GUIDANCE_COUNSELOR` (alunos base + orientação + próprias sinalizações, sem casos/notas), `TEACHER` (alunos das suas turmas + próprias sinalizações em estado seguro), `ADMINISTRATOR` (utilizadores, papéis, definições, auditoria — **sem acesso a conteúdo psicológico**).
3. **Defesa em profundidade**: cada acesso sensível verifica `school_id` + papel + atribuição à turma **no servidor** (`lib/session.ts`, actions) **e** nas policies RLS (`db/migrations/0001_init.sql`, `0002_roles.sql`). UI escondida nunca é controlo.
4. **Fail-closed**: sem `SET LOCAL app.profile_id/school_id`, RLS não devolve linhas. Perfis não clínicos obtêm 0 linhas em `cases/clinical_notes/documents` — sem oráculo de existência.
5. **Notas clínicas**: coluna `clinical_notes.encrypted_content` (AES-256-GCM, chave `APP_ENCRYPTION_KEY` fora da BD). Leitura/criação auditada. Rotação: gerar nova chave, re-cifrar offline, manter chave antiga 30 dias só para leitura, depois destruir (registar em auditoria).
6. **Notificações/emails/logs**: só `safe_text` («tem um compromisso SPO agendado»). Nunca nomes, salas, motivos ou conteúdo clínico.
7. **Ficheiros**: bucket privado, URLs assinados curtos, allowlist PDF/PNG/JPEG/DOC/DOCX ≤10 MB, antivírus pendente no fluxo prod.
8. **Auditoria**: `audit_events` imutável (sem UPDATE/DELETE pela app) para criação/triagem/encerramento, leitura de nota, download/exportação e mudanças de permissões, com `ip_hash`.

## Pendente da escola/EPD (bloqueia produção)

Base legal e avisos de privacidade; quem abre/encerra casos; campos/categorias aprovados; tabela de conservação e eliminação (inclui backups); necessidade de AIPD; autenticação institucional (Entra ID) e MFA; alojamento UE e responsável técnico; protocolo de urgência e escalonamento; quem autoriza sincronização de alunos/turmas; página de privacidade + contactos EPD + fluxo acesso/retificação.

## Operação

Cabeçalhos de segurança + CSRF + rate-limit no login (endurecer em prod), validação Zod em todas as actions, backups Neon cifrados com restauro testado, dados fictícios em dev/staging, proibida cópia de prod sem anonimização. `pnpm audit` no CI. Cada bug de permissão/privacidade ganha teste automatizado antes do fix.

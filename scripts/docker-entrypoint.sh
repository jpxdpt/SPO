#!/bin/sh
set -eu

echo "[spo] A aguardar PostgreSQL..."

attempt=0
until pnpm exec tsx scripts/apply-migrations.ts; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "[spo] PostgreSQL não ficou disponível a tempo."
    exit 1
  fi
  sleep 2
done

# O seed é fictício e só corre numa base vazia. Restarts não duplicam dados.
PROFILE_COUNT=$(pnpm exec tsx -e 'import postgres from "postgres"; (async()=>{const sql=postgres(process.env.DATABASE_URL!,{ssl:false,prepare:false}); const rows=await sql.unsafe("SELECT count(*)::int AS n FROM profiles"); console.log(rows[0].n); await sql.end();})().catch(()=>process.exit(2));' | tail -n 1)
if [ "$PROFILE_COUNT" = "0" ]; then
  echo "[spo] Base vazia: a executar seed fictício..."
  pnpm db:seed
else
  echo "[spo] Base existente: seed ignorado."
fi

echo "[spo] A iniciar aplicação na porta 3000..."
exec pnpm start

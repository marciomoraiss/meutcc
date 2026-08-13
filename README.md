# MEUTCC

MVP responsivo para acompanhamento de TCC, com painel do orientador, painel do aluno, entregas, agendamentos com limites semanais e mentoria assíncrona.

## Stack

- Next.js 16 e React 19
- Supabase Auth, Postgres e Storage
- Netlify para hospedagem

## Desenvolvimento local

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave publicável do projeto Supabase.
3. Execute `npm install` e `npm run dev`.

Validações: `npm run lint` e `npm run build:netlify`.

## Variáveis no Netlify

Cadastre em **Site configuration → Environment variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

O comando de build e a versão do Node estão definidos em `netlify.toml`.

## Banco de dados

As migrações em `supabase/migrations` criam as tabelas, regras de acesso por perfil, limites de agendamento e o bucket privado de arquivos.

Depois de receber o domínio definitivo, inclua a URL do Netlify nas URLs autorizadas do Supabase Auth para que o acesso por link mágico retorne ao aplicativo.

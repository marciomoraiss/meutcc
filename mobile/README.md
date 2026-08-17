# MEUTCC Mobile

Aplicativo nativo do MEUTCC para iPhone e Android, mantido em uma pasta independente do painel web.

## Estado da fase 2

- Base Expo SDK 57, React Native e TypeScript preservada.
- Identidade institucional da TE ORIENTO configurada.
- Acesso sem senha por link enviado ao e-mail.
- Retorno ao aplicativo pelo esquema `meutcc://`.
- Sessão persistida de forma protegida no aparelho.
- Navegação separada por perfil de aluno e orientador.
- Primeira tela real do aluno conectada à API autenticada.
- Vínculo por convite importado ou código da turma.
- Nenhuma alteração necessária na versão web.

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha somente a URL, a chave publicável do Supabase e a URL da API.
3. Execute `npm install` e `npm start` nesta pasta.

Nunca coloque a chave secreta ou `service_role` do Supabase no aplicativo.

## Configuração externa pendente

Antes do teste em aparelho, cadastre `meutcc://auth/callback` como URL permitida no Supabase e configure um SMTP próprio para o domínio `teoriento.com.br`.

Consulte [docs/fase-2-autenticacao.md](docs/fase-2-autenticacao.md) para o roteiro completo.

# Fase 1 — Preparação técnica e identidade

## Identidade inicial

- Nome: **MEUTCC**
- Assinatura: **Seu TCC em acompanhamento**
- Categoria principal: **Educação**
- Cores: azul-marinho `#172743`, vermelho `#B74444` e dourado `#B88A3B`
- Esquema de abertura do aplicativo: `meutcc://`
- Identificador provisório: `com.marciomorais.meutcc`

## Arquitetura aprovada para desenvolvimento

- Um aplicativo React Native/Expo para iPhone e Android.
- O painel web atual permanece independente e continua hospedado no Netlify.
- O aplicativo e o painel usam o mesmo projeto Supabase, respeitando as políticas RLS existentes.
- As regras de negócio permanecem centralizadas na API do MEUTCC para evitar comportamentos diferentes entre web e mobile.
- Sessões são persistidas de forma criptografada no aparelho.
- Credenciais administrativas do Supabase nunca são incluídas no aplicativo.

## Decisões do titular antes de criar os registros nas lojas

1. Publicação em nome de pessoa física ou de organização/pessoa jurídica.
2. Nome público do desenvolvedor que aparecerá nas lojas.
3. Confirmação do identificador `com.marciomorais.meutcc`.
4. E-mail público de suporte e endereço do site de suporte.
5. Titular da marca e responsável pela política de privacidade/LGPD.

Essas escolhas não bloqueiam a construção das telas, mas devem ser concluídas antes da criação definitiva do aplicativo no App Store Connect e no Google Play Console.

## Próxima etapa técnica

A fase 2 começará pela autenticação móvel por e-mail com retorno ao aplicativo, seguida da navegação por perfil e das primeiras telas reais do aluno.

# MEUTCC Mobile

Aplicativo nativo do MEUTCC para iPhone e Android, mantido em uma pasta independente do painel web.

## Estado da fase 1

- Expo SDK 57, React Native e TypeScript configurados.
- Identidade visual inicial alinhada ao painel web.
- Perfis de desenvolvimento, teste interno e produção preparados para EAS Build.
- Cliente Supabase preparado com chave publicável e sessão local criptografada.
- Cliente da API preparado para reutilizar as regras de negócio já hospedadas.
- Nenhuma alteração necessária na versão web.

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha somente a URL, a chave publicável do Supabase e a URL da API.
3. Execute `npm install` e `npm start` nesta pasta.

Nunca coloque a chave secreta ou `service_role` do Supabase no aplicativo.

## Identidade de publicação

- Aplicativo: **MEUTCC**
- Assinatura: **Seu TCC em acompanhamento**
- Publicador: **TE ORIENTO**
- Suporte: **contato@teoriento.com.br**
- Pacote Android e Bundle ID iOS: `br.com.teoriento.meutcc`

Os identificadores foram definidos com base no domínio institucional informado. Eles devem ser registrados nas contas da TE ORIENTO antes do primeiro envio às lojas.

Consulte [docs/fase-1-identidade.md](docs/fase-1-identidade.md) e [docs/dados-para-as-lojas.md](docs/dados-para-as-lojas.md).

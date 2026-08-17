# Fase 1 — Preparação técnica e identidade

## Identidade definida

- Nome: **MEUTCC**
- Assinatura: **Seu TCC em acompanhamento**
- Publicador: **TE ORIENTO**
- E-mail público de suporte: **contato@teoriento.com.br**
- Categoria principal: **Educação**
- Cores: azul-marinho `#172743`, vermelho `#B74444` e dourado `#B88A3B`
- Esquema de abertura do aplicativo: `meutcc://`
- Bundle ID iOS: `br.com.teoriento.meutcc`
- Pacote Android: `br.com.teoriento.meutcc`

O identificador institucional substitui o identificador pessoal provisório. Ele segue o domínio informado pela TE ORIENTO e deve ser confirmado nas contas oficiais antes do primeiro envio.

## Verificação preliminar do nome

Em 17 de agosto de 2026, buscas públicas por **MEUTCC** nas páginas indexadas da App Store e do Google Play não localizaram outro aplicativo com esse nome exato. Foi encontrada a grafia distinta **MyTCC** no Google Play e o domínio comercial `meutcc.org` fora das lojas.

Essa busca não reserva o nome, não substitui a validação feita ao criar o registro no App Store Connect e não constitui pesquisa de marca no INPI.

## Arquitetura aprovada para desenvolvimento

- Um aplicativo React Native/Expo para iPhone e Android.
- O painel web atual permanece independente e continua hospedado no Netlify.
- O aplicativo e o painel usam o mesmo projeto Supabase, respeitando as políticas RLS existentes.
- As regras de negócio permanecem centralizadas na API do MEUTCC para evitar comportamentos diferentes entre web e mobile.
- Sessões são persistidas de forma criptografada no aparelho.
- Credenciais administrativas do Supabase nunca são incluídas no aplicativo.

## Dados empresariais ainda necessários

Antes de abrir ou verificar as contas de organização nas lojas, confirmar:

1. Razão social completa e CNPJ da pessoa jurídica.
2. Endereço e telefone comerciais.
3. Número D-U-N-S associado exatamente à razão social e ao endereço.
4. Titularidade ou autorização de uso do domínio `teoriento.com.br`.
5. URL pública de suporte e URL da política de privacidade/LGPD.
6. Nome comercial **TE ORIENTO** registrado ou autorizado para exibição, quando exigido.

## Próxima etapa técnica

A fase 2 começará pela autenticação móvel por e-mail com retorno ao aplicativo, seguida da navegação por perfil e das primeiras telas reais do aluno.

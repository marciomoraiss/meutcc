# Fase 2 — Autenticação e primeira experiência do aluno

## Entregas implementadas

- Acesso sem senha por link enviado ao e-mail.
- Retorno ao aplicativo pelo endereço `meutcc://auth/callback`.
- Recuperação automática da sessão protegida no aparelho.
- Consulta dos dados reais pela API autenticada do MEUTCC.
- Separação de navegação entre aluno e orientador usando o perfil salvo no banco.
- Vínculo automático para alunos previamente importados.
- Entrada por código da turma quando não houver convite pendente.
- Primeira tela real do aluno com progresso, fase, entrega, agendamento e mentoria.
- Encerramento seguro da sessão.

## Configuração necessária no Supabase

Antes do primeiro teste em aparelho, adicionar em **Authentication > URL Configuration > Redirect URLs**:

```text
meutcc://auth/callback
```

O teste do retorno por link deve ser feito em um development build ou aplicativo instalado, pois o esquema próprio pertence ao MEUTCC.

## Envio de e-mails

O provedor padrão do Supabase é adequado apenas para preparação técnica. Antes de liberar o teste para os 25 alunos, configurar SMTP próprio para o domínio `teoriento.com.br`, mantendo o link de acesso único no modelo de e-mail.

## Segurança

- A chave usada no aplicativo é publicável; chaves secretas e `service_role` permanecem fora do cliente.
- O perfil de autorização vem da tabela protegida `profiles`, não dos metadados editáveis do usuário.
- A API valida o token e as políticas RLS limitam os dados ao aluno ou orientador responsável.
- Nenhuma alteração de banco foi necessária nesta fase.

## Próxima validação

1. Configurar o redirect no Supabase.
2. Configurar SMTP do domínio.
3. Gerar o development build.
4. Testar o acesso com um orientador e um aluno convidado.
5. Validar o comportamento em iPhone e Android.

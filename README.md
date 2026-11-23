# Lukas 3D — Controle de Pedidos

Aplicação Angular para gerenciar pedidos de impressão 3D, com autenticação e sincronização entre dispositivos usando Supabase.

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute [`supabase/schema.sql`](./supabase/schema.sql). A tabela e as políticas RLS associam cada pedido ao usuário autenticado. O script também cria a operação transacional usada para importar backups.
3. Em **Authentication → URL Configuration**, configure a URL pública do app como `Site URL` e adicione a URL local `http://localhost:4200/**` e a URL do Netlify à lista de redirecionamentos permitidos.
4. Em **Authentication → Providers → Email**, mantenha o provedor de e-mail habilitado. Novas contas podem exigir confirmação por e-mail, conforme a configuração de autenticação do projeto.
5. Copie a **Project URL** e a chave pública **anon/publishable** do projeto. Nunca use a chave `service_role` no navegador.

## Executar localmente

1. Instale Node.js 20.19+ ou 22.12+.
2. Defina `SUPABASE_URL` e `SUPABASE_ANON_KEY` no ambiente do terminal.
3. Execute `npm install` e `npm start`; abra `http://localhost:4200`.
4. Para gerar a versão de produção, execute `npm run build`.

O comando de build gera `public/supabase-config.json` a partir das variáveis de ambiente. Esse arquivo é ignorado pelo Git e incluído nos arquivos estáticos publicados.

## Netlify

Conecte o repositório ao Netlify e adicione estas variáveis em **Site configuration → Environment variables**:

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: chave pública anon/publishable do projeto.

O `netlify.toml` define o comando de build e a pasta publicada. Faça um novo deploy após definir ou alterar as variáveis.

## Funcionalidades

- Cadastro, edição, exclusão, pesquisa e filtros de pedidos
- Fluxo de produção, pagamentos, produtos, quantidades e valores
- Painel financeiro com total vendido, recebido, pendências e saldo a receber
- Contato com cliente via WhatsApp
- Exportação e importação de backup JSON
- Sincronização em tempo real dos pedidos da conta autenticada entre dispositivos
- Layout responsivo

## Dados existentes no navegador

Ao entrar, se a conta na nuvem ainda não tiver pedidos, os dados antigos do `localStorage` deste navegador são enviados automaticamente. A cópia local só é removida depois da confirmação do Supabase. Se já houver pedidos na nuvem, os dados locais não são sobrescritos: o app oferece o download de um backup local antes que você decida como importá-lo. A importação de um backup substitui os pedidos atuais da conta.

O valor recebido é armazenado como campo opcional no JSON de cada pedido, sem migração que reescreva os registros existentes. Pedidos “Pago” contam o total como recebido; “Pendente” conta zero; para “Parcial”, informe o valor recebido no formulário. Pedidos parciais antigos sem esse valor são sinalizados para revisão.

Faça backups periódicos. A chave pública do Supabase é visível no app; a proteção dos dados depende das políticas RLS instaladas pelo script SQL. Não desative essas políticas.

# Lukas 3D — Controle de Pedidos

Sistema Angular standalone para gerenciar pedidos de impressão 3D.

## Como executar

1. Instale Node.js 20.19+ ou 22.12+.
2. Execute `npm install`.
3. Execute `npm start` e abra `http://localhost:4200`.
4. Para produção, execute `npm run build`.

## Netlify

Conecte o repositório GitHub ao Netlify. O arquivo `netlify.toml` define o comando de build e a pasta publicada.

## Funcionalidades

- Cadastro, edição, exclusão, pesquisa e filtros de pedidos
- Fluxo de produção e situação de pagamento
- Estimativa de custo e lucro por pedido
- Contato com cliente via WhatsApp
- Exportação/importação de backup JSON
- Layout responsivo

## IMPORTANTE — Armazenamento

Esta versão usa `localStorage` no navegador, sem autenticação e sem sincronização. **Não use como fonte única de dados importantes**: exporte backups. O cálculo de lucro é estimado; não contempla taxas, falhas, impostos, mão de obra e frete. Para produção multiusuário, integrar Supabase Auth + Postgres com RLS e migração dos pedidos.

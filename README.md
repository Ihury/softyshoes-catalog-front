# SOFTY — catálogo de calçados

Catálogo de calçados da SOFTY: os clientes navegam pelo catálogo, montam um
carrinho e enviam o pedido para o vendedor pelo WhatsApp. Um painel admin
permite cadastrar modelos, marcas e o contato do vendedor.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres, Auth, Storage) como backend
- Deploy na [Vercel](https://vercel.com)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Crie um `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Estrutura

- `src/app/(client)` — catálogo, detalhe do modelo e carrinho (público)
- `src/app/pedido/[id]` — resumo de pedido compartilhável, aberto pelo vendedor
- `src/app/admin` — painel administrativo (autenticado via Supabase Auth)
- `src/lib` — clientes Supabase, tipos, formatação e server actions
- `src/components` — componentes de UI, cliente e admin

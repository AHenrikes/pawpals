# Pawpals Monorepo

Pawpals is a Turborepo workspace centered around the `apps/web` Next.js app,
with shared packages for Supabase clients, UI primitives, and base configs.

## Workspace Layout

- `apps/web`: main Next.js 16 app (auth, dashboard, API routes)
- `packages/ui`: shared React UI primitives
- `packages/supabase`: shared Supabase client/server helpers
- `packages/eslint-config`: shared ESLint presets
- `packages/typescript-config`: shared TypeScript configs

## Commands

Use Node.js 20.9 or newer. Run from repository root:

```sh
npm run dev
npm run build
npm run lint
npm run check-types
npm run format
```

Scope to a specific workspace when needed:

```sh
npm run dev -- --filter=@pawpals/web
npm run build -- --filter=@repo/ui
```

## Environment

For local development, configure Supabase variables used by `apps/web`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Place values in your local env file and keep secrets out of git.

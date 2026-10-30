# Pawpals web app

Next.js application for the authenticated Pawpals community. The public routes currently support account creation, sign-in, password recovery, and email confirmation. Profiles and app features require an account.

## Local setup

From the repository root, install dependencies with `npm ci`. Configure these variables for the web app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Run `npm run dev --workspace=@pawpals/web`. The root `README.md` lists monorepo commands. Supabase schema and database test instructions are in `supabase/migrations/README.md`.

## Checks

Run `npm run lint`, `npm run check-types`, and `npm run test --workspace=@pawpals/web` from the repository root. The GitHub Actions workflow runs these checks and a production build.

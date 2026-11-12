# Pawpals web app

Next.js application for the authenticated Pawpals community. The public routes currently support account creation, sign-in, password recovery, and email confirmation. Profiles and app features require an account.

## Local setup

From the repository root, install dependencies with `npm ci`. Configure these variables for the web app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

Run `npm run dev --workspace=@pawpals/web`. The root `README.md` lists monorepo commands. Supabase schema and database test instructions are in `supabase/migrations/README.md`.

## Use the app from another device on the same network

The browser connects directly to Supabase. When testing on a phone or another computer, set `NEXT_PUBLIC_SUPABASE_URL` in `apps/web/.env` to `http://<development-machine-LAN-IP>:54321` instead of `http://127.0.0.1:54321`. Keep the existing publishable/anon key. Restart the web dev server after changing the environment file; Next.js embeds public variables in browser code.

Add `http://<development-machine-LAN-IP>:3000/`, `/confirm`, and `/new-password` to `[auth].additional_redirect_urls` in `supabase/config.toml`, then restart local Supabase for the auth configuration to take effect. Open `http://<development-machine-LAN-IP>:3000` on the other device.

If the page opens but sign-in still cannot connect, try `http://<development-machine-LAN-IP>:54321/auth/v1/health` from that device. If it is unreachable, allow TCP port 54321 through the development machine's firewall and check that the local Supabase API is listening on the LAN interface. Guest Wi-Fi or client isolation can also block device-to-device traffic.

## Checks

Run `npm run lint`, `npm run check-types`, and `npm run test --workspace=@pawpals/web` from the repository root. The GitHub Actions workflow runs these checks and a production build.

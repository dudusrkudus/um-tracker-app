# Ultra Marathon Race Control

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and configure your Supabase and Telegram tokens:
   ```bash
   cp .env.example .env.local
   ```
4. Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` or `TELEGRAM_BOT_TOKEN` to the browser.
5. Run the development server:
   ```bash
   npm run dev
   ```

## Stack
- Next.js App Router
- Tailwind CSS
- Supabase (Auth, Realtime, Database)

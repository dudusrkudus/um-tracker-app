-- Phase 8: Telegram Integration

-- 1. Add Telegram fields to runners
ALTER TABLE public.runners 
ADD COLUMN telegram_user_id bigint,
ADD COLUMN telegram_chat_id bigint,
ADD COLUMN telegram_pairing_code text;

-- Ensure pairing code is unique if set
CREATE UNIQUE INDEX runners_telegram_pairing_code_idx ON public.runners (telegram_pairing_code) WHERE telegram_pairing_code IS NOT NULL;
CREATE INDEX runners_telegram_user_id_idx ON public.runners (telegram_user_id) WHERE telegram_user_id IS NOT NULL;

-- 2. Create telegram_updates table to prevent duplicate processing
CREATE TABLE public.telegram_updates (
  update_id bigint PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Note: RLS for telegram_updates is not necessary since it's only accessed by the server-side Webhook API (Service Role)

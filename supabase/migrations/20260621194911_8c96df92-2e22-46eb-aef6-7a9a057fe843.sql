ALTER TABLE public.organizational_structure
  ADD COLUMN IF NOT EXISTS fib_addon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS psicossociais_addon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkup_addon_enabled boolean NOT NULL DEFAULT false;
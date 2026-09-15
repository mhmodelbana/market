-- HAMASA SUPERMARKET
-- Weighted product selling migration
-- Safe for existing products: legacy products remain piece-based.

BEGIN;

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS selling_method text NOT NULL DEFAULT 'piece',
    ADD COLUMN IF NOT EXISTS base_unit text NOT NULL DEFAULT 'piece',
    ADD COLUMN IF NOT EXISTS base_price numeric(12,2),
    ADD COLUMN IF NOT EXISTS allow_custom_weight boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS weight_step_grams integer,
    ADD COLUMN IF NOT EXISTS min_weight_grams integer,
    ADD COLUMN IF NOT EXISTS max_weight_grams integer;

UPDATE public.products
SET
    selling_method = COALESCE(NULLIF(selling_method, ''), 'piece'),
    base_unit = COALESCE(NULLIF(base_unit, ''), 'piece'),
    base_price = COALESCE(base_price, price),
    allow_custom_weight = COALESCE(allow_custom_weight, false),
    weight_step_grams = COALESCE(weight_step_grams, 50),
    min_weight_grams = COALESCE(min_weight_grams, 250)
WHERE true;

ALTER TABLE public.products
    ALTER COLUMN base_price SET DEFAULT 0,
    ALTER COLUMN weight_step_grams SET DEFAULT 50,
    ALTER COLUMN min_weight_grams SET DEFAULT 250;

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_selling_method_check;

ALTER TABLE public.products
    ADD CONSTRAINT products_selling_method_check
    CHECK (selling_method IN ('piece', 'weight'));

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_weight_settings_check;

ALTER TABLE public.products
    ADD CONSTRAINT products_weight_settings_check
    CHECK (
        selling_method = 'piece'
        OR (
            base_unit = 'kg'
            AND base_price >= 0
            AND weight_step_grams > 0
            AND min_weight_grams > 0
            AND (max_weight_grams IS NULL OR max_weight_grams >= min_weight_grams)
        )
    );

CREATE INDEX IF NOT EXISTS products_selling_method_idx
    ON public.products (selling_method);

COMMIT;

-- Verification
SELECT
    id,
    name,
    price,
    selling_method,
    base_unit,
    base_price,
    allow_custom_weight,
    weight_step_grams,
    min_weight_grams,
    max_weight_grams
FROM public.products
ORDER BY created_at DESC;

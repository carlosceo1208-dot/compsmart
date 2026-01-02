-- Cupom de Lançamento 30% OFF (válido até 06/02/2026)
INSERT INTO discount_coupons (
  code,
  discount_type,
  discount_value,
  is_active,
  valid_from,
  valid_until,
  max_uses,
  used_count
) VALUES (
  'LANCAMENTO30',
  'percentage',
  30,
  true,
  NOW(),
  '2026-02-06 23:59:59-03',
  NULL,
  0
);
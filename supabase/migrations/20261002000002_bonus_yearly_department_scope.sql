DROP FUNCTION IF EXISTS public.get_bonus_yearly_totals();

CREATE OR REPLACE FUNCTION public.get_bonus_yearly_totals(p_dpc_codes text[])
RETURNS TABLE (
  bonus_year integer,
  paid_before_cutoff numeric,
  paid_from_cutoff numeric,
  unpaid_before_cutoff numeric,
  unpaid_from_cutoff numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    EXTRACT(YEAR FROM bonus."BonusDate")::integer,
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'paid'
        AND COALESCE(NULLIF(btrim(bonus."PaidDPC"), ''), distributor."RegisteredDPC") = ANY(p_dpc_codes)
        AND bonus."BonusDate" < DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'paid'
        AND COALESCE(NULLIF(btrim(bonus."PaidDPC"), ''), distributor."RegisteredDPC") = ANY(p_dpc_codes)
        AND bonus."BonusDate" >= DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'unpaid'
        AND distributor."RegisteredDPC" = ANY(p_dpc_codes)
        AND bonus."BonusDate" < DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'unpaid'
        AND distributor."RegisteredDPC" = ANY(p_dpc_codes)
        AND bonus."BonusDate" >= DATE '2026-08-01'
    ), 0)
  FROM public."Bonus" AS bonus
  LEFT JOIN public."Distributors" AS distributor
    ON distributor."DistributorIDNO" = bonus."DistributorIDNO"
  WHERE COALESCE(cardinality(p_dpc_codes), 0) > 0
  GROUP BY EXTRACT(YEAR FROM bonus."BonusDate")
  ORDER BY EXTRACT(YEAR FROM bonus."BonusDate");
$$;
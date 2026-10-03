CREATE OR REPLACE FUNCTION public.get_bonus_yearly_totals()
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
        AND bonus."BonusDate" < DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'paid'
        AND bonus."BonusDate" >= DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'unpaid'
        AND bonus."BonusDate" < DATE '2026-08-01'
    ), 0),
    COALESCE(SUM(bonus."BonusValue") FILTER (
      WHERE lower(btrim(bonus."Status")) = 'unpaid'
        AND bonus."BonusDate" >= DATE '2026-08-01'
    ), 0)
  FROM public."Bonus" AS bonus
  GROUP BY EXTRACT(YEAR FROM bonus."BonusDate")
  ORDER BY EXTRACT(YEAR FROM bonus."BonusDate");
$$;
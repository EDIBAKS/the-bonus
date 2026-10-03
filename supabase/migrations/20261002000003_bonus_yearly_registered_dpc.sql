DROP FUNCTION IF EXISTS public.get_bonus_yearly_totals(text[]);

CREATE OR REPLACE FUNCTION public.get_bonus_yearly_totals(p_department_name text)
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
  INNER JOIN public."Distributors" AS distributor
    ON distributor."DistributorIDNO" = bonus."DistributorIDNO"
  WHERE EXISTS (
    SELECT 1
    FROM public.dpc
    WHERE public.dpc.dpccode = distributor."RegisteredDPC"
      AND (p_department_name IS NULL OR public.dpc.department = p_department_name)
  )
  GROUP BY EXTRACT(YEAR FROM bonus."BonusDate")
  ORDER BY EXTRACT(YEAR FROM bonus."BonusDate");
$$;
ALTER TABLE public."Bonus"
ADD COLUMN IF NOT EXISTS "PaidDPC" text;

UPDATE public."Bonus" AS bonus
SET "PaidDPC" = distributor."RegisteredDPC"
FROM public."Distributors" AS distributor
WHERE bonus."DistributorIDNO" = distributor."DistributorIDNO"
  AND bonus."Status" = 'Paid'
  AND bonus."PaymentDate" >= TIMESTAMP '2026-08-01 00:00:00'
  AND bonus."PaymentDate" < TIMESTAMP '2026-09-01 00:00:00'
  AND bonus."PaidDPC" IS NULL;

CREATE OR REPLACE FUNCTION public.capture_bonus_paid_dpc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW."Status" = 'Paid'
    AND (
      TG_OP = 'INSERT'
      OR OLD."Status" IS DISTINCT FROM 'Paid'
      OR NEW."PaidDPC" IS NULL
    )
  THEN
    SELECT distributor."RegisteredDPC"
    INTO NEW."PaidDPC"
    FROM public."Distributors" AS distributor
    WHERE distributor."DistributorIDNO" = NEW."DistributorIDNO"
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_bonus_paid_dpc ON public."Bonus";

CREATE TRIGGER capture_bonus_paid_dpc
BEFORE INSERT OR UPDATE OF "Status" ON public."Bonus"
FOR EACH ROW
EXECUTE FUNCTION public.capture_bonus_paid_dpc();

COMMENT ON COLUMN public."Bonus"."PaidDPC" IS
  'Distributor RegisteredDPC captured when this Bonus is paid.';

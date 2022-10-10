CREATE OR REPLACE FUNCTION disallow_payments_for_null_project_code() RETURNS TRIGGER
AS $$
BEGIN
  IF (NEW.project_code IS NULL AND NEW.paymentstatus_id = 'created')
  THEN
      RAISE EXCEPTION 'Error, project_code can not be null for new payments';
  END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

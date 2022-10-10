CREATE OR REPLACE FUNCTION disallow_payments_for_null_project_code() RETURNS TRIGGER
AS $$
BEGIN
  IF (NEW.project_code IS NULL)
  THEN
      RAISE EXCEPTION 'Error, project_code can not be null for new payments';
  END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER project_code_cannot_be_null_for_new_payments
  BEFORE INSERT ON virkailija.payments
  FOR EACH ROW
EXECUTE PROCEDURE disallow_payments_for_null_project_code();

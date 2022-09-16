CREATE OR REPLACE FUNCTION disallow_ta_tili_insert_or_update_when_published() RETURNS TRIGGER
AS $$
BEGIN
  IF (
    SELECT status NOT IN ('draft', 'new')
      FROM hakija.avustushaut
      WHERE id = NEW.avustushaku_id)
  THEN
      RAISE EXCEPTION 'Error, avustushaku has been published, cannot modify TA-tili';
  END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION disallow_ta_tili_delete_when_published() RETURNS TRIGGER
AS $$
BEGIN
  IF (
    SELECT status NOT IN ('draft', 'new')
    FROM hakija.avustushaut
    WHERE id = OLD.avustushaku_id)
  THEN
    RAISE EXCEPTION 'Error, avustushaku has been published, cannot delete TA-tili';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ta_tili_cannot_be_modified_if_avustushaku_has_been_published
  BEFORE UPDATE OR INSERT ON virkailija.avustushaku_talousarviotilit
  FOR EACH ROW
EXECUTE PROCEDURE disallow_ta_tili_insert_or_update_when_published();

CREATE TRIGGER ta_tili_cannot_be_deleted_if_avustushaku_has_been_published
  BEFORE DELETE ON virkailija.avustushaku_talousarviotilit
  FOR EACH ROW
EXECUTE PROCEDURE disallow_ta_tili_delete_when_published();

-- Don't actually delete tili entries, instead mark them as "deleted"
ALTER TABLE talousarviotilit
  ADD COLUMN deleted TIMESTAMP WITH TIME ZONE;

ALTER TABLE avustushaku_talousarviotilit
  ADD COLUMN deleted TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION verify_ta_tili_row_is_not_deleted() RETURNS TRIGGER
AS $$
BEGIN
  IF (
    NEW.deleted IS NULL
    AND EXISTS(
      SELECT FROM virkailija.talousarviotilit
        WHERE NEW.talousarviotili_id = id
        AND deleted IS NOT null ))
  THEN
      RAISE EXCEPTION 'Error, referred talousarviotili is marked as deleted';
  END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER talousarviotili_row_must_not_be_deleted
  BEFORE UPDATE OR INSERT ON virkailija.avustushaku_talousarviotilit
  FOR EACH ROW
EXECUTE PROCEDURE verify_ta_tili_row_is_not_deleted();


CREATE OR REPLACE FUNCTION verify_cannot_delete_ta_tili_if_still_used() RETURNS TRIGGER
AS $$
BEGIN
  IF (
      NEW.deleted IS NOT NULL
      AND EXISTS(
        SELECT FROM virkailija.avustushaku_talousarviotilit
        WHERE talousarviotili_id = NEW.id
          AND deleted IS null ))
  THEN
    RAISE EXCEPTION 'Error, talousarviotili is still being used';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avustushaku_talousarviotilit_must_not_be_in_use
  BEFORE UPDATE OR INSERT ON virkailija.talousarviotilit
  FOR EACH ROW
EXECUTE PROCEDURE verify_cannot_delete_ta_tili_if_still_used();

-- Fix V1_156 incorrect "DROP CONSTRAINT" statement
DROP INDEX IF EXISTS unique_not_normalized_tatili_code_and_name;

-- Allow user to "delete" talousarviotili and create it again with same name and year
DROP INDEX IF EXISTS unique_normalized_tatili_code_and_year;

CREATE UNIQUE INDEX unique_normalized_tatili_code_and_year_and_not_deleted
  ON talousarviotilit(code, year)
  WHERE NOT migrated_from_not_normalized_ta_tili
  AND deleted IS NULL;

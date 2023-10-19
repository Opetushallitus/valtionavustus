CREATE TRIGGER update_forms_updated_at_timestamp
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_timestamp();

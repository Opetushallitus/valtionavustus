DELETE FROM virkailija.va_users_cache
WHERE email IS NULL;
ALTER TABLE virkailija.va_users_cache
ALTER COLUMN email SET NOT NULL;

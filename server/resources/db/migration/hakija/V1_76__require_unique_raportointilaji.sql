ALTER TABLE hakija.raportointivelvoite
  ADD CONSTRAINT require_unique_raportointilaji_for_avustushaku UNIQUE (avustushaku_id, raportointilaji);

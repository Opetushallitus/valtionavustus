CREATE TABLE avustushaku_talousarviotilit (
  avustushaku_id  INTEGER NOT NULL,
  talousarviotili_id INTEGER NOT NULL,
  koulutusasteet JSONB NOT NULL,
  FOREIGN KEY (avustushaku_id) REFERENCES hakija.avustushaut (id),
  FOREIGN KEY (talousarviotili_id) REFERENCES virkailija.talousarviotilit (id)
)

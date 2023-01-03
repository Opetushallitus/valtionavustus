select distinct hp.hakemus_id from
  hakija.hakemukset h
  inner join  hakemus_paatokset hp on hp.hakemus_id=h.id
where avustushaku=:avustushaku_id and version_closed is null
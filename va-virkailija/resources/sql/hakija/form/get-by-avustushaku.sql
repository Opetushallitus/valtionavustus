select f.* from hakija.forms f
join hakija.avustushaut a on a.form = f.id
where a.id = :avustushaku_id
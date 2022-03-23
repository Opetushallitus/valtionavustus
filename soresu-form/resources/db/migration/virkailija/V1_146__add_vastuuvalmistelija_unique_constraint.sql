create unique index unique_vastuuvalmistelija_idx
on avustushaku_roles (avustushaku, role)
where (role = 'vastuuvalmistelija');

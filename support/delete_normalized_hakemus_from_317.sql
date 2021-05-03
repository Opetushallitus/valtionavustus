select content->'name'->'fi' from avustushaut where id = 317;

select count(*) from normalized_hakemus
where hakemus_id in (select id from hakemukset where avustushaku = 317);

delete from normalized_hakemus
where hakemus_id in (select id from hakemukset where avustushaku = 317);

select count(*) from normalized_hakemus
where hakemus_id in (select id from hakemukset where avustushaku = 317);

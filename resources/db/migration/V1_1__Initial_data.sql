BEGIN;
insert into forms (metadata) VALUES ('{"foo": "bar"}');
insert into forms (metadata) VALUES ('{"foo": "baz"}');
COMMIT;

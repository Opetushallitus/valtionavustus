BEGIN;
insert into forms (content) VALUES ('{
"name":{"fi":"Laatustrategian toimeenpanon tuki","sv":"Stöd för genomförande av kvalitetsstrategin"},
"fields":[
  {"id":"nimi","displayAs":"textField","label":{"fi":"Hankkeen nimi","sv":"Projektets namn"}},
  {"id":"tavoitteet","displayAs":"textArea","label":{"fi":"Hankkeen tavoitteet","sv":"Projektets mål"}},
  {"id":"kuvaus","displayAs":"textArea","label":{"fi":"Hankkeen kuvaus","sv":"Hur genomförs projektet i praktiken?"}}
]
}');
COMMIT;

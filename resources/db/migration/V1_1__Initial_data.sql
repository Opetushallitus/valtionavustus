BEGIN;
insert into forms (content) VALUES ('{
"name":{"fi":"Laatustrategian toimeenpanon tuki","sv":"Stöd för genomförande av kvalitetsstrategin"},
"fields":[
  {"id":"nimi","displayAs":"textField","label":{"fi":"Hankkeen nimi","sv":"Projektets namn"}},
  {"id":"uusi","displayAs":"dropdown","label":{"fi":"Uusi/jatkava hanke","sv":"Nytt/fortsatt projekt"},"options":[
    {"value":"uusi","label":{"fi":"Uusi hanke","sv":"Nytt projekt"}},
    {"value":"jatkava","label":{"fi":"Jatkava hanke","sv":"Fortsatt projekt"}}
  ]},
  {"id":"tavoitteet","displayAs":"textArea","label":{"fi":"Hankkeen tavoitteet","sv":"Projektets mål"}},
  {"id":"kuvaus","displayAs":"textArea","params":{"cols":120,"rows":20,"maxlength":5000},"label":{"fi":"Hankkeen kuvaus","sv":"Hur genomförs projektet i praktiken?"}},
  {"id":"kohderyhma","displayAs":"textArea","label":{"fi":"Hankkeen kohderyhma","sv":"Projektets målgrupp"}},
  {"id":"arviointi","displayAs":"textArea","label":{"fi":"Miten hankkeen tavoitteiden toteutumista ja vaikuttavuutta arvioidaan?","sv":"Vilka konkreta resultat eftersträvas och hur har man för avsikt att utnyttja dem?"}},
  {"id":"paikkakunnat","displayAs":"textField","params":{"maxlength":200},"label":{"fi":"Paikkakunnat","sv":"Orter"}},
  {"id":"alue","displayAs":"dropdown","label":{"fi":"Alue","sv":"Område"},"options":[
    {"value":"valtakunnallinen","label":{"fi":"Valtakunnallinen","sv":"Riksomfattande"}},
    {"value":"alueellinen","label":{"fi":"Alueellinen","sv":"Regionalt"}},
    {"value":"paikallinen","label":{"fi":"Paikallinen","sv":"Lokalt"}}
  ]},
  {"id":"tiedotus","displayAs":"textArea","label":{"fi":"Miten hankkeesta tiedotetaan ja miten tulokset levitetään?","sv":"Hur kommer man att informera om projektet och hur kommer resultaten att spridas?"}},
  {"id":"www-osoite","displayAs":"textField","label":{"fi":"Hankkeen www-osoite","sv":"Projektets webbadress"}}
]}');
COMMIT;

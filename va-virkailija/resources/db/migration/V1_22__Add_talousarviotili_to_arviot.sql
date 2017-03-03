alter table arviot add column talousarviotili varchar(128);
comment on column arviot.talousarviotili is 'Talousarviotili of rahoitusalue';

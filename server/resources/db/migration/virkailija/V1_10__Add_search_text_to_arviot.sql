alter table arviot add search_text varchar(32);
comment on column arviot.search_text is 'Search text supplied by user';

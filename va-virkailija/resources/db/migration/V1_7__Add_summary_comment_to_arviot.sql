alter table arviot add summary_comment text;
comment on column arviot.summary_comment is 'Comment to be shown on the summary page (ratkaisuyhteenveto) of avustushaku on the row of the hakemus in question';

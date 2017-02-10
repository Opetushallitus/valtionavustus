alter table hakemukset add language varchar(2) not null default 'fi';
with sv_submissions as (
    select s.id as sv_submission_id, s.version as sv_submission_version
    from form_submissions s WHERE answers -> 'value' @> '[{"key": "language", "value": "sv", "fieldType": "radioButton"}]'
)
update hakemukset set language = 'sv' from sv_submissions
where form_submission_id = sv_submissions.sv_submission_id and form_submission_version = sv_submissions.sv_submission_version;
with sv_hakemukset as (
    select h.id as sv_id
    from hakemukset h WHERE language = 'sv' and version_closed is null
)
update hakemukset set language = 'sv' from sv_hakemukset
where parent_id = sv_hakemukset.sv_id;

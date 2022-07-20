create index arviot_status_idx on virkailija.arviot (status);
create index payments_version_closed_paymentstatus_id_idx on virkailija.payments (version_closed, paymentstatus_id);
create index payments_application_version_idx on virkailija.payments (application_version);
create index tapahtumaloki_tyyppi_idx on virkailija.tapahtumaloki (tyyppi);

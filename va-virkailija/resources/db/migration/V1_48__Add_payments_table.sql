CREATE TABLE payments (
    id                  INTEGER NOT NULL,
    version             INTEGER NOT NULL DEFAULT 0,
    version_closed      TIMESTAMP,
    created_at          TIMESTAMP with time zone NOT NULL DEFAULT now(),
    application_id      INTEGER NOT NULL,
    application_version INTEGER NOT NULL,
    state               INTEGER NOT NULL,
    installment_number  INTEGER NOT NULL,
    organisation        VARCHAR(4) NOT NULL,
    document_type       VARCHAR(2) NOT NULL,
    invoice_date        DATE,
    due_date            DATE,
    receipt_date        DATE,
    transaction_account VARCHAR(4) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
    partner             VARCHAR(6) NOT NULL,
    inspector_email     TEXT NOT NULL,
    acceptor_email      TEXT NOT NULL,
    PRIMARY KEY (id, version)
);

CREATE SEQUENCE payments_id_seq;
CREATE INDEX ON payments (application_id);

comment on table payments is 'Payments table (maksatus)';
comment on column payments.application_id is 'Hakemus id';
comment on column payments.installment_number is 'Order number of "maksuerä"';
comment on column payments.organisation is 'Organisation id of "maksuerä".
For example "6600".';
comment on column payments.document_type is 'Tositelaji';
comment on column payments.transaction_account is 'Maksuliikemenotili';
comment on column payments.partner is 'Kumppanikoodi';


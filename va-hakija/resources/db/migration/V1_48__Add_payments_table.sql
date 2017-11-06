CREATE TABLE payments (
    id                  serial PRIMARY KEY,
    created_at          timestamp with time zone NOT NULL DEFAULT now(),
    application_id      INTEGER NOT NULL,
    application_version INTEGER NOT NULL,
    grant_id            INTEGER NOT NULL,
    state               INTEGER NOT NULL,
    installment         VARCHAR(9) NOT NULL,
    document_type       VARCHAR(2) NOT NULL,
    invoice_date        DATE NOT NULL DEFAULT now() + '7 days',
    due_date            DATE NOT NULL DEFAULT now() + '7 days',
    amount              INTEGER NOT NULL,
    long_ref            VARCHAR(14) NOT NULL,
    receipt_date        DATE NOT NULL DEFAULT now() + '7 days',
    transaction_account VARCHAR(4) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
    lkp_account         VARCHAR(8) NOT NULL,
    takp_account        VARCHAR(12) NOT NULL,
    partner             VARCHAR(6) NOT NULL,
    inspector_email     TEXT NOT NULL,
    acceptor_email      TEXT NOT NULL,
    FOREIGN KEY (grant_id) REFERENCES avustushaut (id)
);

comment on table payments is 'Payments table (maksatus)';
comment on column payments.application_id is 'Hakemus id';
comment on column payments.grant_id is 'Haku id';
comment on column payments.installment is 'Maksuerä';
comment on column payments.document_type is 'Tositelaji';
comment on column payments.long_ref is 'Pitkäviite';
comment on column payments.transaction_account is 'Maksuliikennemenotili';

CREATE INDEX ON payments (application_id);
CREATE INDEX ON payments (grant_id);

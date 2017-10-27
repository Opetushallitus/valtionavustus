CREATE TABLE payments (
    id                  serial PRIMARY KEY,
    created_at          timestamp with time zone NOT NULL DEFAULT now(),
    application_id      INTEGER NOT NULL,
    application_version INTEGER NOT NULL,
    grant_id            INTEGER NOT NULL,
    state               INTEGER NOT NULL,
    installment         VARCHAR(9),
    document_type       VARCHAR(2),
    invoice_date        DATE,
    due_date            DATE,
    amount              INTEGER NOT NULL,
    long_ref            VARCHAR(14),
    receipt_date        DATE,
    transaction_account VARCHAR(4),
    currency            VARCHAR(3) NOT NULL DEFAULT 'EUR',
    lkp_account         VARCHAR(8),
    takp_account        VARCHAR(12),
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

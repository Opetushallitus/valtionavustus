ALTER TABLE payments ADD installment_number INTEGER;
UPDATE payments SET installment_number = 0;
ALTER TABLE payments
  ALTER installment_number SET NOT NULL;
ALTER TABLE payments ADD organisation VARCHAR(4);
UPDATE payments SET organisation = '6600';
ALTER TABLE payments
  ALTER organisation SET NOT NULL;
ALTER TABLE payments DROP installment;

comment on column payments.installment_number is 'Order number of "maksuerä"';
comment on column payments.organisation is 'Organisation id of "maksuerä".
For example "6600".';

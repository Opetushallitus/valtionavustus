ALTER TABLE forms ADD updated_at  timestamp with time zone default now();
update forms set updated_at=created_at;

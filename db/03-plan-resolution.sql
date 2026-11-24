-- Old decisions have no reliable receipt association. Preserve their unknown resolution.
alter table studio.plan_changes
  add column if not exists resolution text check (resolution in ('paid', 'waived', 'rejected')),
  add column if not exists invoice_id uuid references studio.invoices(id) on delete set null;

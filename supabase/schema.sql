create extension if not exists "pgcrypto";

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_inputs (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  price_cents integer not null,
  notary_fee_mode text not null check (notary_fee_mode in ('percent','fixed')),
  notary_fee_percent_bps integer,
  notary_fee_cents integer,
  works_cents integer not null,
  furniture_cents integer not null,
  down_payment_cents integer not null,
  loan_rate_bps integer not null,
  loan_years integer not null check (loan_years between 5 and 30),
  insurance_mode text not null check (insurance_mode in ('percent','fixed')),
  insurance_rate_bps integer,
  insurance_monthly_cents integer,
  rent_monthly_cents integer not null,
  vacancy_rate_bps integer not null check (vacancy_rate_bps between 0 and 5000),
  recoverable_charges_monthly_cents integer not null,
  non_recoverable_charges_monthly_cents integer not null,
  property_tax_cents integer not null,
  pno_cents integer not null,
  management_fee_bps integer not null,
  tmi_bps integer not null check (tmi_bps between 0 and 4500),
  regime text not null check (regime in ('micro','reel')),
  amortization_enabled boolean not null default false,
  constraint simulation_inputs_one_per_simulation unique (simulation_id),
  constraint simulation_inputs_notary_fee_consistency check (
    (notary_fee_mode = 'percent' and notary_fee_percent_bps is not null) or
    (notary_fee_mode = 'fixed' and notary_fee_cents is not null)
  ),
  constraint simulation_inputs_insurance_consistency check (
    (insurance_mode = 'percent' and insurance_rate_bps is not null) or
    (insurance_mode = 'fixed' and insurance_monthly_cents is not null)
  )
);

create table if not exists public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  created_at timestamptz not null default now(),
  regime text not null check (regime in ('micro','reel')),
  total_project_cost_cents integer not null,
  notary_fees_cents integer not null,
  loan_amount_cents integer not null,
  monthly_payment_cents integer not null,
  monthly_insurance_cents integer not null,
  monthly_payment_total_cents integer not null,
  annual_rent_gross_cents integer not null,
  annual_vacancy_cents integer not null,
  annual_rent_net_cents integer not null,
  annual_charges_cents integer not null,
  annual_cashflow_before_tax_cents integer not null,
  monthly_cashflow_before_tax_cents integer not null,
  monthly_savings_effort_cents integer not null,
  tax_base_cents integer not null,
  tax_estimated_cents integer not null,
  interest_year1_cents integer not null,
  amortization_annual_cents integer not null,
  annual_cashflow_after_tax_cents integer not null,
  monthly_cashflow_after_tax_cents integer not null,
  gross_yield_bps integer not null,
  net_yield_bps integer not null,
  verdict_explanation text not null,
  constraint simulation_results_unique_per_simulation_regime unique (simulation_id, regime)
);

create index if not exists simulation_inputs_simulation_id_idx on public.simulation_inputs(simulation_id);
create index if not exists simulation_results_simulation_id_idx on public.simulation_results(simulation_id);
create index if not exists simulations_user_created_idx on public.simulations(user_id, created_at);

alter table public.simulations enable row level security;
alter table public.simulation_inputs enable row level security;
alter table public.simulation_results enable row level security;

create policy "simulations_select" on public.simulations
  for select using (auth.uid() = user_id);

create policy "simulations_insert" on public.simulations
  for insert with check (auth.uid() = user_id);

create policy "simulations_update" on public.simulations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "simulations_delete" on public.simulations
  for delete using (auth.uid() = user_id);

create policy "simulation_inputs_select" on public.simulation_inputs
  for select using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_inputs.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_inputs_insert" on public.simulation_inputs
  for insert with check (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_inputs.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_inputs_update" on public.simulation_inputs
  for update using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_inputs.simulation_id
        and simulations.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_inputs.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_inputs_delete" on public.simulation_inputs
  for delete using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_inputs.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_results_select" on public.simulation_results
  for select using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_results.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_results_insert" on public.simulation_results
  for insert with check (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_results.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_results_update" on public.simulation_results
  for update using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_results.simulation_id
        and simulations.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_results.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

create policy "simulation_results_delete" on public.simulation_results
  for delete using (
    exists (
      select 1 from public.simulations
      where simulations.id = simulation_results.simulation_id
        and simulations.user_id = auth.uid()
    )
  );

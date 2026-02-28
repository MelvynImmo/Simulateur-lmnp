-- Replace the user_id below with a real auth user UUID.

with inserted_simulation as (
  insert into public.simulations (user_id, name)
  values ('00000000-0000-0000-0000-000000000000', 'Exemple Lyon')
  returning id
)
insert into public.simulation_inputs (
  simulation_id,
  name,
  price_cents,
  notary_fee_mode,
  notary_fee_percent_bps,
  notary_fee_cents,
  works_cents,
  furniture_cents,
  down_payment_cents,
  loan_rate_bps,
  loan_years,
  insurance_mode,
  insurance_rate_bps,
  insurance_monthly_cents,
  rent_monthly_cents,
  vacancy_rate_bps,
  recoverable_charges_monthly_cents,
  non_recoverable_charges_monthly_cents,
  property_tax_cents,
  pno_cents,
  management_fee_bps,
  tmi_bps,
  regime,
  amortization_enabled
)
select
  id,
  'Exemple Lyon',
  20000000,
  'percent',
  750,
  null,
  1000000,
  500000,
  3000000,
  370,
  20,
  'percent',
  25,
  null,
  85000,
  600,
  5000,
  9000,
  90000,
  13000,
  700,
  3000,
  'reel',
  true
from inserted_simulation;

with inserted_simulation as (
  select id from public.simulations where name = 'Exemple Lyon' order by created_at desc limit 1
)
insert into public.simulation_results (
  simulation_id,
  regime,
  total_project_cost_cents,
  notary_fees_cents,
  loan_amount_cents,
  monthly_payment_cents,
  monthly_insurance_cents,
  monthly_payment_total_cents,
  annual_rent_gross_cents,
  annual_vacancy_cents,
  annual_rent_net_cents,
  annual_charges_cents,
  annual_cashflow_before_tax_cents,
  monthly_cashflow_before_tax_cents,
  monthly_savings_effort_cents,
  tax_base_cents,
  tax_estimated_cents,
  interest_year1_cents,
  amortization_annual_cents,
  annual_cashflow_after_tax_cents,
  monthly_cashflow_after_tax_cents,
  gross_yield_bps,
  net_yield_bps,
  verdict_explanation
)
select
  id,
  'reel',
  23000000,
  1500000,
  20000000,
  118058,
  4167,
  122225,
  1020000,
  61200,
  958800,
  278116,
  -786016,
  -65501,
  65501,
  0,
  0,
  728405,
  766667,
  -786016,
  -65501,
  443,
  296,
  'Cash-flow negatif.'
from inserted_simulation;

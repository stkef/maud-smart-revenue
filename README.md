# MAUD Smart Revenue System

**Predicts which taxpayers are likely to default, helps municipal officers analyse them, and sends each
one the right reminder through the cheapest channel that works.**

Built for a **Government of Andhra Pradesh hackathon** (Municipal Administration & Urban Development),
where it was **selected and taken into development**.

---

## The problem

Municipal bodies collect property, water and sewage tax from thousands of households. Most people pay
on time; a minority fall into arrears. Chasing everyone the same way wastes money and annoys good
payers, while the real defaulters are found too late.

## What MAUD does

1. **Scores default risk.** Every taxpayer carries a default-risk probability (0–1), stored with the
   factors behind it, and is placed in a band: **high** (> 0.6), **medium** (0.3–0.6) or **low** (< 0.3).
2. **Shows officers where to look.** Dashboards break risk down by ward and zone, track arrears and
   recovery over time, and list the highest-risk taxpayers with their dues, delays and payment history.
3. **Sends low-cost, risk-matched reminders ("nudges").**

   | Risk | Channel | Message |
   |---|---|---|
   | High | WhatsApp, falling back to SMS | Urgent: overdue, act now to avoid penalties |
   | Medium | SMS | Friendly reminder before late fees |
   | Low | SMS | Thank-you / upcoming due date |

   The expensive, attention-grabbing channel is spent only where it matters, and **nudges stop
   automatically once a taxpayer pays**, so nobody is messaged (or billed for) after settling.
4. **Bills and collects.** A billing engine adds a delay-based penalty
   (`penalty = delay_days × daily_rate × due_amount`), and a payment flow updates arrears and nudge status.
5. **Lets citizens check themselves.** A public risk-lookup page shows a taxpayer their own standing.

## Screens

| Route | Who | What |
|---|---|---|
| `/` | Officers, admins | Revenue dashboard: KPI cards, risk distribution, ward risk, arrears trend and recovery, high-risk table, taxpayer detail, send nudge, nudge history |
| `/payments` | Officers, admins | Billing and payments |
| `/risk-lookup` | Citizens | Look up a taxpayer's risk card |
| `/auth` | Everyone | Sign in / sign up |

Roles: **admin** (also manages user roles) and **officer**.

## Architecture

```
React + TypeScript dashboard (Vite, Tailwind, shadcn/ui, Recharts, React Query)
        │
        ├── Orchestrator ── Billing engine (penalties)
        │                ├─ Payment service (mock gateway)
        │                └─ Decision engine (risk → channel, priority, message)
        │                        └─ Notification service ── Twilio gateway (SMS / WhatsApp) | mock gateway
        │
        └── Supabase: Postgres (taxpayers, tax_records, risk_scores, nudges, profiles, user_roles)
                      Auth · Row Level Security on every table · Edge Function `send-twilio-message`
```

- Twilio credentials live only in the Edge Function's server-side secrets (`TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`), never in the browser.
- A mock messaging and payment gateway lets the whole flow run without real messages or money.
- `src/data/taxpayer_demo_data.json` holds 30 demo taxpayers (ward, zone, property type, tax type, dues,
  arrears, delay, payment mode, risk probability and category).

## My role

I built the **React / TypeScript dashboard** for revenue and collection monitoring: the charts, summary
cards, taxpayer tables and detail views.

## Run it locally

```bash
npm install
npm run dev
```

Needs a Supabase project: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` (the
publishable key is safe in the browser because every table enforces Row Level Security), apply the
migrations in `supabase/migrations`, and add the Twilio secrets to the Edge Function to send real
messages.

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Recharts · TanStack Query · Supabase
(Postgres, Auth, RLS, Edge Functions) · Twilio (SMS, WhatsApp)

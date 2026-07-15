# SaaS Example: InvoiceFlow

InvoiceFlow is a fictional product that helps small service businesses issue recurring invoices, collect payments, and follow up on overdue balances.

I included a SaaS example because recurring revenue does not make a product production-ready. Tenancy, permissions, billing, webhooks, audit history, migrations, and operational recovery become part of the user promise. These are difficult to add safely after the data model and provider assumptions have spread.

## What this example demonstrates

- define the cash-collection outcome before pricing or dashboard features;
- make tenant scope part of every data-access boundary;
- treat payment webhooks as the source of truth and process them idempotently;
- separate the product's subscription billing from its customers' invoice payments;
- keep reminders asynchronous and recheck state before sending.

## Documents before implementation

1. [`product.md`](product.md) establishes the customer, core outcome, pricing assumption, and first-release limits.
2. [`architecture.md`](architecture.md) defines tenant isolation, invoice state, Razorpay events, email delivery, deployment, and evolution triggers.

## How I would deliver it

1. Validate workflows with five business owners and manually run two invoice cycles.
2. Define organization, customer, invoice, payment, and reminder state transitions.
3. Publish backend contracts and webhook rules.
4. Implement tenant-safe persistence and payment reconciliation.
5. Build invoice and reminder interfaces against those contracts.
6. Pilot with test-mode payments, then a deliberately small production cohort.

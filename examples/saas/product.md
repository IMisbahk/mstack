# Product: InvoiceFlow

> Status: Approved for private beta
> Owner: Product founder
> Last updated: 2026-07-15

**Playbook lesson:** I keep the product narrower than a full accounting suite.
The goal is better cash collection for a specific business, not a checklist of
finance features.

## Vision

Small service businesses maintain predictable cash flow without spending evenings tracking invoices and writing reminders.

## Problem

Independent agencies and consultancies create invoices in documents or spreadsheets, copy payment links into email, and manually check bank or gateway records. Overdue follow-up is inconsistent because it is awkward and time-consuming. Existing accounting suites are often broader than the user's workflow and require setup they avoid.

Interviews with eight India-based service businesses found that seven reconcile invoices manually and five delay reminders by at least a week.

## Target users and personas

**Primary user:** an owner or operations lead at a 2–20 person India-based service business that sends 10–200 recurring invoices monthly.

**Secondary users:** staff who prepare invoices and clients who view and pay them.

**Owner persona:** wants to know what is due, issue consistent recurring invoices, and send professional reminders without adopting a full accounting system. Success means less administrative time and faster payment.

## Needs and first-release features

| Need | Capability | Acceptance summary |
| --- | --- | --- |
| Reuse client and service details | Customer and recurring invoice profiles | Owner creates a monthly schedule with line items and tax fields |
| Know invoice state | Invoice dashboard | Draft, sent, viewed, partially paid, paid, overdue, and void states are visible |
| Make payment easy | Hosted invoice with Razorpay checkout | Client opens secure link and pays; verified webhook updates state |
| Follow up consistently | Reminder schedule | Configurable emails send before/after due date and stop after full payment |
| Trust the record | Audit trail and reconciliation | State-changing actions and provider references are inspectable |

## Non-goals

- Full accounting ledger, payroll, inventory, expense tracking, multi-currency, marketplace payouts, custom invoice designer, or mobile applications.
- Automated late fees in the beta.

## Goals and metrics

| Metric | Private-beta target |
| --- | --- |
| Time to create first recurring invoice | Median under 10 minutes |
| On-time payment rate | Improve participating business baseline by 15% after two cycles |
| Manual reminder time | Reduce by 75% |
| Payment reconciliation accuracy | 100% of verified test and beta webhook events reflected exactly once |
| Monthly retained beta organizations | At least 70% after three months |

Guardrails: zero cross-organization data exposure; email complaint rate below 0.1%; payment or invoice events never silently disappear.

## Pricing hypothesis

One flat monthly plan with an invoice allowance is simpler for the beta than per-seat billing. Razorpay processes customer payments; the product subscription may also use Razorpay but remains a separate bounded module. Validate willingness to pay before adding plan complexity.

## Core journey

1. An owner creates an organization and invites an optional staff member.
2. They add a customer and configure a monthly invoice profile.
3. The scheduler creates a draft; the owner reviews and sends it.
4. The client opens the signed invoice link and pays through Razorpay.
5. A verified webhook records payment and stops reminders.
6. The owner sees the result and audit trail.

## Constraints and risks

- India and INR only in beta; tax fields are user-provided and the product does not give tax advice.
- Email and payment providers are external dependencies; delayed events must reconcile safely.
- Organizations expect financial data export and deletion; define both before production.
- Automation can send an inappropriate reminder after an offline payment; beta includes manual mark-paid with a visible audit event.

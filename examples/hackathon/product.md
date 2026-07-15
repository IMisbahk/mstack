# Product: QueueLess

> Status: Approved for prototype
> Owner: Hackathon team
> Last updated: 2026-07-15

**Playbook lesson:** under a 36-hour constraint, I still define the user,
outcome, non-goals, and guardrails. The document stays short because the risk
is small, not because thinking became optional.

## Vision

Attendees spend event time meeting people and learning, not standing in uncertain lines.

## Problem

Popular sponsor booths create physical queues. Attendees cannot estimate the wait, abandon sessions to hold a place, and often leave before reaching the booth. Booth operators repeatedly answer wait-time questions and cannot contact people who step away.

This is a hackathon hypothesis based on observation at two events. Five attendee conversations during the first two hours will test whether remote queueing is desirable and whether phone notifications are acceptable.

## Target users and persona

**Primary user:** an in-person hackathon attendee with a smartphone who wants to visit a busy booth without losing work time.

**Secondary user:** the booth operator who advances the queue and needs a simple view that works during a conversation.

**Persona — focused attendee:** wants to join in under 20 seconds, see position and rough wait, leave without penalty, and receive a warning shortly before their turn.

## User needs

| Need | Evidence/confidence |
| --- | --- |
| Join without installing an app or creating a password | Hypothesis; high importance |
| Trust that position is preserved | Hypothesis; high importance |
| Know when to return | Observed pain; medium confidence |
| Operator can advance the line in one action | Operator interview; high confidence |

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| QR join | Attendee enters the correct booth queue quickly | QR opens a mobile form; name and phone create one active entry |
| Live position | Attendee can choose how to spend the wait | Status page shows people ahead and approximate wait |
| Operator advance | Queue keeps moving | Authenticated operator marks current entry complete and calls the next |
| Return notification | Attendee comes back near their turn | Notification is attempted at three people ahead and recorded |
| Leave queue | Attendee remains in control | Leaving removes the entry from active order immediately |

## Non-goals

- Multi-event accounts, payments, sponsor analytics, queue reservations, priority tiers, native apps, and perfect wait-time prediction.
- Production-grade SMS delivery for the demo; an in-app status plus one notification adapter is sufficient.

## Goals and success metrics

| Goal/metric | Target during demo |
| --- | --- |
| Join completion | At least 90% of test users join without help |
| Join time | Median under 20 seconds |
| Queue integrity | No duplicate position or skipped active attendee in a 20-person simulation |
| Core value | At least 7 of 10 testers prefer it to a physical line |

Guardrails: an attendee's phone number is never visible to another attendee or booth operator, and notification failure never blocks queue advancement.

## Constraints and assumptions

- 36-hour build, four contributors, one event, fewer than 500 queued attendees.
- Reliable mobile internet is assumed; the operator view needs a manual refresh fallback.
- Phone numbers are deleted within 24 hours of the demo.
- A single booth operator credential is acceptable for the prototype.

## Core journey

1. An attendee scans the booth QR code.
2. They enter a display name and phone number and consent to one notification.
3. The system returns an opaque status link and queue position.
4. The operator advances the queue; the attendee sees updates and receives a warning.
5. The attendee arrives, is served, and their entry becomes complete.

## Open questions

- Can a web push notification be configured reliably within two hours, or should the demo adapter use email/SMS?
- What return warning—three people or five minutes—do test attendees understand better?

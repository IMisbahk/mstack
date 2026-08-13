# Mobile Application Example: FieldNote

FieldNote is a fictional offline-first app for municipal inspectors who capture site notes and evidence photos on iOS and Android, then sync when a network returns.

I included a mobile example because permission prompts, store-review constraints, and offline queues are product decisions. They change what the inspector can finish in a basement, what the city may collect, and whether the first release can ship. Treating them as implementation details produces an app that looks complete on Wi-Fi and fails in the field.

## What this example demonstrates

- treat camera, location, and notification permissions as user-facing states, not OS footnotes;
- make offline capture and durable sync the core journey, not a later enhancement;
- use assigned sites as the location source of truth so precise tracking is unnecessary;
- keep one backend and shared domain rules rather than splitting "mobile APIs";
- plan store privacy labels and background-mode limits before the first TestFlight or Play track.

## Documents before implementation

1. [`product.md`](product.md) defines one inspector cohort, permission fallbacks, and an offline-complete inspection.
2. [`architecture.md`](architecture.md) describes on-device state, the sync outbox, photo handling, and store-release constraints.

## How I would deliver it

1. Ride along with inspectors and capture where notes are lost today.
2. Define inspection, photo, permission, and sync state transitions, including denial and conflict.
3. Publish the backend contract and idempotent submit rules.
4. Implement on-device persistence and the outbox before polish UI.
5. Build the inspection journey against that contract on both platforms.
6. Pilot with a small crew, including no-signal sites, before a store submission.

## Suggested mstack packs

Pack ids to consider later: `mobile` and `qa-testing`. `mstack pack recommend` may cite repository evidence for them; it does not install packs. Adding a pack remains an explicit choice.

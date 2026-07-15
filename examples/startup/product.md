# Product: CareCircle

> Status: Approved for concierge pilot
> Owner: Founding team
> Last updated: 2026-07-15

**Playbook lesson:** this document is designed to make the startup falsifiable.
Evidence thresholds, guardrails, and stop conditions matter more than a long
roadmap while the core behavior is still uncertain.

## Vision

Families can coordinate everyday recovery support with clarity, dignity, and less stress.

## Problem

After an older relative returns home from hospital, family members coordinate meals, transport, check-ins, and household tasks through calls and group chats. Responsibilities are implicit, schedule changes get buried, and one person becomes the default coordinator. Clinical record management is not the immediate need; knowing who will do what and whether it happened is.

Six exploratory interviews found repeated coordination failures, but this is not enough evidence of willingness to adopt or pay. The first pilot is designed to test behavior before product breadth.

## Target users and personas

**Primary user:** the family member coordinating a two-to-six week recovery period for an older relative living at home.

**Collaborators:** invited relatives, friends, or paid non-clinical helpers who claim and complete tasks.

**Person receiving care:** a participant whose consent, visibility, and preferences constrain the entire plan, even when they do not operate the application.

**Coordinator persona:** currently spends at least three hours per week assigning and confirming support, uses messaging apps comfortably, and succeeds when tasks have owners without repeated chasing.

## First pilot capabilities

| Capability | User outcome | Pilot boundary |
| --- | --- | --- |
| Shared recovery plan | Everyone sees the same current non-clinical tasks | One care circle and one timezone |
| Invitations and roles | Coordinator includes only trusted people | Coordinator and helper roles; explicit participant consent |
| Claim and complete | A task gains a visible owner and status | One assignee, due time, note, and completion confirmation |
| Reminders and digest | People remember commitments without chat chasing | In-app plus email; no SMS in the pilot |
| Coordinator overview | Missed or unclaimed tasks are visible | Daily summary and manual follow-up |

## Non-goals

- Medical advice, medication dosing, emergency response, health-record storage, insurance, clinical-provider integration, paid caregiver marketplace, location tracking, or automated risk scoring.

The product must clearly direct urgent or medical concerns to appropriate services rather than presenting itself as a clinical system.

## Goals and evidence thresholds

| Assumption or outcome | Evidence needed to continue |
| --- | --- |
| A shared plan improves coordination | At least 7 of 10 pilot coordinators report fewer follow-up messages after two weeks |
| Helpers will update task state | At least 70% of claimed tasks updated without coordinator intervention |
| The workflow prevents missed commitments | At least 30% fewer missed pilot tasks than the family's recalled baseline |
| Families will keep using it | At least 6 of 10 circles active in week three |
| Someone will pay | At least 4 coordinators accept a real, stated monthly price in a follow-up offer |

Guardrails: no unauthorized circle access, no marketing use of care information, email opt-out works immediately, and support can remove access within one hour during pilot coverage.

## Concierge workflow

1. A coordinator and the person receiving care review consent and pilot boundaries with the startup.
2. Operations creates the circle and imports an agreed task list.
3. The coordinator invites helpers and assigns or opens tasks.
4. Helpers claim and complete work; the coordinator sees exceptions.
5. Operations checks in twice weekly, records confusion, and resolves data corrections through an audited admin path.
6. The team reviews outcome and guardrail metrics before adding automation.

## Assumptions and risks

- Families may consider another app more work than chat; test time-to-first-value under ten minutes.
- The coordinator may invite someone without the participant's informed consent; require recorded consent and a visible member list.
- Users may enter medical details despite guidance; minimize free text, show warnings, and provide deletion controls.
- Reminder fatigue can damage trust; default to a digest and let each helper control non-critical reminders.

## Pivot and stop conditions

Stop the pilot if access control fails, users repeatedly treat the product as an emergency service, or consent cannot be implemented clearly. Revisit the target user if helpers do not update tasks but coordinators still value a private planning view. Do not add clinical features to rescue weak engagement.

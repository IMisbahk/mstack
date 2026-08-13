# Product: FieldNote

> Status: Approved for field pilot
> Owner: City inspections product lead
> Last updated: 2026-08-13

**Playbook lesson:** platform permissions, offline queues, and store-release
rules are product scope. An inspector who cannot save without signal, or who
is blocked by a camera prompt, does not have a working inspection tool.

## Vision

Municipal inspectors finish an accurate site record in the field, even without a network, without handing the city more location data than the assignment already provides.

## Problem

Inspectors currently jot notes in paper packets or a generic notes app, take photos in the camera roll, and retype a report at the office. Basements, rural parcels, and parking structures regularly have no useful signal. Lost drafts and mismatched photos cause revisits and disputed findings.

Nine inspector interviews (observation) found that seven had lost at least one in-progress record in the past month to connectivity, an OS kill, or a crash. Office staff (observation) spend a same-day hour merging photos to addresses. Whether a dedicated app will be used if paper remains allowed is still a hypothesis.

## Target users and personas

**Primary user:** a municipal property or safety inspector who completes 6–12 assigned site visits per shift on a city-issued phone.

**Secondary users:** a supervisor who assigns today's sites, and a records clerk who needs a complete submitted inspection.

**Inspector persona:** works in variable signal, needs to capture notes and evidence photos in under a few minutes per site, will deny unused permissions, and succeeds when an inspection can be marked complete locally and is known to have synced later.

## User needs

| Need | Evidence |
| --- | --- |
| Save notes and photos with no network | Observed; high confidence |
| Survive app kills and battery swaps mid-visit | Observed; high confidence |
| Know assigned sites without hunting an address | Observed; medium confidence |
| Continue if camera or location is denied | Hypothesis; high importance |
| Avoid citywide tracking of the inspector | Inspector concern; treat as a constraint |

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| Assigned site list | Inspector knows today's work | Downloaded list usable offline after last successful sync |
| Offline inspection draft | Work is not lost underground | Notes save locally; OS kill restores the same draft |
| Evidence photos | Finding is documented | Camera capture attaches to the inspection; library-wide access is not required |
| Local complete | Shift can finish without signal | Complete is valid on device; sync is a separate durable queue |
| Sync status | Inspector trusts submission | Per-inspection states: pending, syncing, synced, failed, needs attention |
| Permission fallbacks | Denial does not brick the visit | Location optional; photo-required items stay incomplete until a photo exists |

## Non-goals

- Live supervisor tracking, background location, citizen-facing reporting, automatic code-violation decisions, wearables, offline maps as a navigation product, or multi-city tenancy.
- Editing another inspector's submitted record in the pilot.

## Success metrics

| Metric | Six-week pilot target |
| --- | --- |
| Inspections completed in the field without a same-visit office retype | At least 80% of pilot visits |
| Local drafts lost after process death or overnight | 0 in the instrumented cohort |
| Sync eventual success within 24 hours of regained network | At least 99% of completed inspections |
| Visits blocked solely by a permission dialog | Under 5% |
| Inspector-reported extra time vs paper | Median not worse than current after week two |

Guardrails: no continuous location trail stored or transmitted; photos are inspection-scoped; store privacy labels match actual collection; accessibility target is the platform equivalent of WCAG 2.2 AA for inspector-facing flows.

## Core journey

1. The inspector syncs assignments on city Wi-Fi before leaving.
2. At a basement site they open the assigned record, write findings, and take two camera photos with no signal.
3. They deny location; the assigned parcel remains the site identity.
4. They mark the inspection complete; it stays queued on device.
5. On return to coverage the outbox submits; the inspector sees synced.
6. The clerk opens a complete record with photos attached to the correct site.

## Constraints and risks

- iOS and Android permission copy, photo-picker rules, and privacy nutrition labels are release constraints, not QA trivia.
- Background modes that look like tracking will fail both staff trust and store review; the pilot uses foreground capture only.
- Hypothesis: one inspector owns a draft until submit; concurrent edits are out of scope and must be rejected, not merged silently.
- Devices are city-issued; still treat the filesystem and photos as sensitive municipal records with retention aligned to existing inspection policy.

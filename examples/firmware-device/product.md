# Product: DockSense

> Status: Approved for hardware pilot
> Owner: Harbor operations product lead
> Last updated: 2026-08-13

**Playbook lesson:** firmware products are constrained by physics and by what
you have measured. Fail-safe defaults and bench evidence belong in the
product definition; marketing range and battery claims do not.

## Vision

Marina staff can see which slips are occupied without walking the dock, without pretending the system knows more than the sensor has honestly reported.

## Problem

Harbor staff currently walk slips or rely on radio calls from boaters. Occupancy knowledge is stale at night and during weather. A vacant-looking slip that is occupied causes conflict; a dead sensor that looks vacant is worse.

Observation from one marina manager interview and two staff shadowing sessions: evening walkthroughs miss transient occupancy, and staff already distrust "smart dock" vendors that advertised month-long batteries. Hypothesis: BLE pucks plus unknown-as-a-first-class state will be trusted if vacant is never inferred from silence. Whether staff will still walk the dock daily is an open question the pilot must measure.

## Target users and personas

**Primary user:** a marina dockmaster who assigns slips and needs a trustworthy occupancy board during operating hours.

**Secondary users:** staff who walk the dock when the board says unknown, and a technician who replaces batteries and devices.

**Dockmaster persona:** checks occupancy on a phone or office display, will not accept silent vacant, and succeeds when unknown triggers a walk rather than a booking.

## User needs

| Need | Evidence |
| --- | --- |
| Occupied vs vacant vs unknown are distinct | Staff distrust; high confidence |
| Silence or dead battery must not look vacant | Observed hazard; high confidence |
| Device is battery powered with no slip wiring | Site constraint; observation |
| Board usable from the office, not only on the pier | Manager request; medium confidence |
| Honest limits on range and battery | Prior vendor failure; high confidence |

## First-release features

| Feature | User outcome | Acceptance summary |
| --- | --- | --- |
| Three-state occupancy | Staff know what is actually known | Occupied, vacant, unknown; never a fourth implied state |
| BLE advertisement | Nearby gateway receives slip status | Documented payload; gateway absence yields unknown, not vacant |
| Last-seen and stale | Age of evidence is visible | Display shows time since last authentic report |
| Fail-safe timeout | Lost sensors cannot hide | After the declared timeout, status becomes unknown |
| Device identity | Technician can replace a puck | Slip mapping is a backend record, not a burned-in berth name only |
| Bench-gated claims | Sales and docs stay honest | No battery-life or range number ships without a named bench test |

## Non-goals

- Boat identification, cameras, GPS tracking, payment, reservations, mesh networking, customer-facing maps, or automatic enforcement.
- Over-the-air updates that can brick without a recover-in-place path. Pilot updates are local and attended.
- Claiming months of battery life, waterproof ratings, or pier-length range before environmental bench tests.

## Success metrics

| Metric | Hardware-pilot target |
| --- | --- |
| False vacant while a boat is in the slip | 0 in attended trials |
| Status unknown when the puck is powered off | 100% of timeout tests |
| Operator time vs full dock walk for the piloted slips | Measure; continue only if staff report less wasted walking |
| Firmware image size | Under the SoC budget recorded in architecture |
| Public battery or range claims | 0 until bench evidence is attached |

Guardrails: occupancy is not identity; no camera; no precise tracking of people. Lost BLE is unknown. Accessibility target for the operator display is WCAG 2.2 AA.

## Core journey

1. A technician mounts a puck, maps its device id to slip A12, and confirms a gateway hears it.
2. A boat occupies the slip; the puck advertises occupied; the office board updates.
3. The boat leaves; the puck advertises vacant after the debounce window.
4. The battery dies; advertisements stop; the board shows unknown with last-seen, not vacant.
5. Staff walk A12 and replace the puck; mapping is updated.
6. No datasheet claims a runtime the bench has not measured.

## Constraints and risks

- Salt, cold, and RF on a pier are not lab conditions. Pilot evidence is labeled lab vs dock.
- Hypothesis: debounce will hide brief vacancies from people walking past; validate on-dock, not only on a bench.
- Regulatory: BLE transmit power and markings must follow the chosen SoC's certifications; the product does not invent RF claims.
- The backend is an internal operator tool. It must not present unknown as vacant to make utilization look high.

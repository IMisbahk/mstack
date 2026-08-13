# Firmware Device Example: DockSense

DockSense is a fictional battery-powered occupancy sensor for marina slips. It advertises occupied, vacant, or unknown over BLE to a nearby gateway, with a small firmware image and a modest backend for operators.

I included a firmware example because hardware boundaries and fail-safe defaults are product promises. Battery life, detection accuracy, and radio range cannot be claimed from a schematic. A slip reported vacant because the battery died is a product failure, not an ops footnote.

## What this example demonstrates

- define fail-safe occupancy when the sensor, radio, or battery fails;
- keep firmware, gateway, and backend in a modular monolith with explicit hardware adapters;
- treat BLE payloads and image size as contracts;
- refuse performance and accuracy claims without bench evidence;
- constrain OTA and debug access so a bad image cannot brick the dock silently.

## Documents before implementation

1. [`product.md`](product.md) defines marina operators, the occupancy states, and what the first hardware pilot will not claim.
2. [`architecture.md`](architecture.md) describes firmware duties, BLE protocol, fail-safe timeouts, and verification gates.

## How I would deliver it

1. Walk a marina and record how slips are checked today, including night and weather.
2. Define occupied, vacant, unknown, and last-known-stale as product states.
3. Freeze the BLE advertisement contract and image-size budget.
4. Implement firmware sleep, sense, and advertise loops with fail-safe defaults.
5. Build a small gateway-to-API path and operator list against that contract.
6. Bench radio, battery, and detection before any public range or month-long claim.

## Suggested mstack packs

Pack ids to consider later: `embedded-firmware` and `systems`. `mstack pack recommend` may cite repository evidence for them; it does not install packs. Adding a pack remains an explicit choice.

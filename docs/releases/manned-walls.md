# Manned walls and guard towers

Previous release: `9529f0ce8cc1f43c962f0e665a0ad9ced15c5519`.

## Requested feature and implementation boundaries

This update adds one wall-upgrade tier with thicker walkable parapets and actual
militia, town guards and soldiers on elevated positions. Completed guard towers
now also have visible occupants, climbing and ranged firing. The population cap,
map size, existing troop limits, recurring production and staffing allocator are
not expanded.

The existing colony had no automatically attacking enemy agents. The new ranged
combat is therefore exposed through an optional, clearly labelled defense
exercise. It is not a hidden automatic raid system. Six moving targets approach;
ready archers use real arrows, with range, wall obstruction, travel, impact and
cooldown rules. Targets can reduce a simulated defense meter, but never cause
civilian losses or permanent damage. There is no reward. This additional exercise
is a testing/player-demonstration control, not a claim that the brief prescribed
new invasion rules.

## Playing the update

Reload normally without clearing browser saves. Open **Defesa das muralhas** or
tap a tower/wall. Completed towers automatically receive available defenders.
Authorize **muralhas estágio 3** after both stone rings are complete. The guild
builds external then internal sides only after the existing essential works and
subject to normal materials, cash reserve, staffing and maintenance safeguards.
Authorization itself grants no free construction and suspending it leaves paid
work in progress intact.

| Upgrade | Per side | Four sides |
|---|---|---|
| External parapet | 2,000 gold + 60 stone | 8,000 gold + 240 stone |
| Internal parapet | 1,500 gold + 40 stone | 6,000 gold + 160 stone |
| Added maintenance | 0.25 gold per cycle | 2 gold per cycle for all eight sides |

Each completed tower has two slots; each upgraded wall side has four. Full
fortifications have 48 positions, not 48 free people: at most the existing 30
militia/guards/soldiers can fill them. Archers prefer towers, while melee sentries
can guard parapets. Ground approaches use gates and interior-edge corridors;
units visibly climb and descend. **Recolher guarnição** orders a real return
journey. A militia hunt waits for its assigned participants to descend and return
before gathering, so troops do not appear in two deployments simultaneously.

Only bow-equipped stationed defenders fire. Each shot consumes one arrow. Empty
quivers refill only from an existing, stocked ammunition depot. The older game's
already-paid 20-arrow kit is migrated once, and an empty saved quiver remains
empty. The re-equipment control consumes one bow and 20 arrows, returns the old
weapon to the correct capped arsenal, and does not add personnel or wages.

## Technical and save guarantees tested

Movement and projectiles update in 0.1 simulated-second steps; rendering is
read-only and bounded. There are at most 30 troop records, 48 posts, six exercise
targets and 64 in-flight arrows. These counts are limits, not per-inventory-unit
objects. Post geometry and assignment decisions are cached; irrelevant animation
clocks do not invalidate the staffing snapshot. Detailed panel refresh is bounded
to about four times per real second when open.

New state is stored inside the existing defense save section. Legacy saves default
to unexpanded wall sides; no stored resources or construction are invented. Troop
positions, climbing, recall, ammunition and in-flight exercise projectiles survive
reload. Malformed records are clamped/deduplicated. Existing save keys and the
450-resident supported housing limit remain unchanged.

The baseline comparison excludes only the four newly introduced top-level feature
fields; every pre-existing field still compares exactly. New fields have their own
explicit regression and browser save/reload coverage.

## Reproduction

```sh
node verification/smoke-test.js
node verification/militia-hunts-test.js
node verification/clarity-test.js
node verification/baseline-equivalence-test.js
PREVIOUS_RUNTIME_REF=9529f0ce8cc1f43c962f0e665a0ad9ced15c5519 node verification/baseline-equivalence-test.js
node verification/walls-test.js
python verification/browser-hunts.py
python verification/browser-clarity.py --url http://127.0.0.1:8765/
python verification/browser-walls.py --url http://127.0.0.1:8765/
python verification/performance-walls.py --baseline /path/to/previous/index.html --seconds 20
```

Browser commands require Playwright and Chromium. `--url` verifies served HTML
against the exact checkout. Local `--isolated` checks use in-memory synthetic saves
where serving a local origin is unavailable; they are not live-release checks.
No physical phone, Safari, thermal, battery or hardware-GPU certification is implied.

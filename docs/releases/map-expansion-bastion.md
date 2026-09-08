# Map expansion and stronghold restructure

Baseline: `c158b99822563e0f94c5f47ac00391e05de0b1c0`.

## Scope and geography

The requested 25% expansion means **25% more total world area**: 14,000 x 9,000
becomes **17,500 x 9,000**, with the coast moving to x=16,600. It does not mean
25% on both dimensions. Individual buildings retain their sizes. The three
residential district grounds have more space between their original 90 houses;
each house still has its original footprint and capacity. Population stays 450.

The inner enclosure is now a protected stronghold for administration, treasury,
training and barracks, wood/metal arms, arrows, tools, armor, valuable merchandise,
medical reserves, food reserves and the cistern. The existing two decorative
prestige houses serve as labelled stronghold quarters, without new inhabitants.
The enclosure remains rectangular; this is a functional bastion, not a new
star-fortification or siege model.

The outer enclosure contains housing, market, clinics, education, religion,
cooking and light production, with distinct service streets. Farms, extraction,
sawmill/wood-weapon activities, builders, workshops, butchery and the cemetery are
outside; coastal trade/fishing and shipbuilding occupy a separate port corridor.
Only site positions change: no existing building is demolished, duplicated,
refunded or granted for free.

Twelve explicitly empty development reserves total **12,407,200 world-square
units**, spanning different sizes and three protection zones. Dashed lots indicate
future room, not usable new buildings or automatically granted production slots.
Further open ground is also available. Manual placement is a future task, not a
control in this release.

Open **Planta da cidade** for **Mapa inteiro**, **Cidadela**, **Cidade externa**
or **Portos**, and an optional vacant-lot overlay. Zoom now reaches 8% to include
the larger full map. Normal reload is sufficient; do not clear player storage.
The longstanding unequal mobile map projection is not redesigned here.

## Transport, defenses and utilities

The road system keeps eight stable upgrade-category IDs and their paid levels,
but replaces the old coordinate network with orthogonal trunk roads, residential
streets and individual frontages. A cached, split intersection graph chooses
connected routes and rejects building/wall crossings. A failed route stays
blocked and is reported in the internal diagnostic set; there is no unsafe
straight-line fallback. Endpoints inside a workplace use a clear door-side exit.

Seven stable gates and eight tower identities are relocated with both enclosures.
Fortified gates, stone walls and third-tier parapet completion counts are retained.
The paid counts now span the new geometry; relocation itself has no extra charge.
There are still 48 possible elevated posts and at most 30 actual defenders.
Approaches use gates and inner patrol corridors, then the appropriate ladder.
Garrison travel lengths can change; fixed movement speeds are not compensated by
teleporting units. Hunting continues using its existing phase and catch state.

The potable network has six connected polylines feeding the four original wells.
The distinct brown wastewater network has 19 connected polylines, including all
15 housing-row collectors, and a southern sea outfall below the port district.
Pipes follow separate underground easements and pass enclosure boundaries at
actual gates. Existing water/sewer construction flags and maintenance rules still
control them. This is checked network geography, **not** new pressure, water-flow,
sewage treatment, marine-current or pollution simulation.

Dedicated wagons still move cargo through the existing capacity/production model.
Visual trips now follow the relocated sites, but this release does not introduce
a distance-priced or fully arrival-gated freight economy. All established money,
wages, tax rates, poverty protection, inventory limits and recipes remain in force.

## Save migration

A separate `expansao.plantaRevisao` field records fixed-layout revision 1. Neither
the old map reset version nor the colony reset version is increased. Paid works,
construction progress, identities, household addresses, balances and stocks are
retained. Geographic camera focus is translated to the relocated nearby site;
an old fully zoomed-out view becomes the new full-map view.

Garrison post IDs survive. Old approach/return paths are rebuilt and fractional
progress retained; climbing/descending height and ammunition/cooldowns persist.
An active optional exercise translates its targets and in-flight arrows once,
retaining projectile time and already-spent arrows. A second load is idempotent.
Snapshots are compared after the normal zero-time first-frame registry rebuild:
the existing loader reconstructs household membership from saved person addresses.
No household members or financial fields are excluded to hide that ordering.

The unfinished purposeful-movement/paid-visit prototype is preserved privately and
**not included**. Current 56-second local daily-life routines remain. More space
alone does not fix the previously reported lack of purposeful travel. That feature
must be re-based on this layout and finish its save/performance checks separately.

## Verification design: three passes

1. **Independent geometry and topology:** body/roof/road clearance, all reserved
   plots, all 160 site/house frontages, all 144 category/post approach combinations,
   foundation arrivals and actual job endpoints; connected water/sewage, well
   terminals, housing-row collectors and legal gate crossings. Python geometry
   checks consume geometry exported from the actual runtime, not a parallel plan.
2. **Simulation and saves:** original suites, true historical-source readers,
   active nonspatial economic comparisons, nine legacy-save migration scenes
   (partial construction, approach, climb, station, descent, return, flight, hunt
   and ordinary colony), exact new-layout reloads and bounded caches. Geographic
   fields intentionally differ; money, people, jobs, stocks and paid stages do not.
3. **Browser/release:** existing feature acceptance plus new desktop/touch-mobile
   map controls, relocated inventory tapping, complete-map bounds and old-save
   migration; exact published bytes and a foreground one-minute presence sample.
   Paired performance is reported separately, with unfavorable samples retained.

An old test reader intercepted only `node:fs` even though its harness used `fs`.
This has been corrected; explicit old/new world-width assertions prove the test
really compares different runtimes. Map-related old fixture expectations were
updated without deleting their assertions. Economic comparisons explicitly state
which geographic fields differ rather than claiming complete runtime equality.

Reproduction from repository root:

```sh
node verification/map-layout-test.js
node verification/export-map-layout.js
python verification/map-geometry-audit.py
node verification/map-fixture.js
python verification/browser-map-layout.py --url http://127.0.0.1:8765/
python verification/performance-map-layout.py --baseline /path/to/c158b99-index.html --seconds 20
```

Independent geometry requires shapely and networkx. Browser checks require
Playwright/Chromium. `--isolated` uses disposable in-memory saves, not a live
origin. The full existing regression suite remains mandatory. No physical-phone,
Safari, thermal, battery or long-session no-stall certification is implied.

## Still open

Manual placement: preview/rotation, collision and service corridors, valid gates,
water/sewage connections, confirmed costs/refunds, stable identity and migration,
atomic move/cancel, usable touch controls and performance limits. Record this
before implementing user placement rather than allowing arbitrary coordinate edits.

Issue #5 remains open for funded businesses, productive employment, household and
property choices, and replacing the legacy money-flow bridge. Purposeful work,
break/public spaces and paid destination visits remain an unfinished separate
prototype. The resident-ledger performance and map projection remain future work.

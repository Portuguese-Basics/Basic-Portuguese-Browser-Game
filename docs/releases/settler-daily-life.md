# Settler daily life and visibility — part 2

Previous main: `df0c05bae2b9a748b36b9801738c28c446f609b6`.
Runtime SHA-256: `d14782e43be0e2f1d2be3227ae6812d3fa64e704020a21e901fc6072ae266623`.

## What the player sees

The established colony's tiny anonymous dots and overlapping doorway residents
are replaced by identity-linked human silhouettes. Clothing, headwear, short
walking animations and exterior work circuits make people legible without
creating new inhabitants. Fields have dispersed workers; indoor occupations
periodically come into their work yards; reserves circulate and pause in their
own neighborhoods. Children play or walk locally. Babies have a small porch/crib
representation and never become extra laborers.

Each ordinary routine repeats every 56 simulated seconds. Indoor and home-based
routines spend at most 14 seconds inside and the remaining 42 outside; outdoor
occupations stay outside. Identity-hashed phase offsets keep people from emerging
in one synchronized wave. At normal foreground 1x this comfortably meets the
requested approximately one outdoor appearance per minute. Pause freezes the
clock; faster speeds accelerate it. The clock is saved and restored.

This is **world availability**, not a promise that every person fits in the
current camera viewport. Zoom and pan still choose which area is visible. Actual
hunting parties remain absent while hunting off-map and are explicitly labelled
as such; no duplicates are generated to satisfy the visibility target. Ground
military, wall garrisons and expedition positions reuse their existing rendering.

Open **Moradores e impostos**, select a person, and press **Localizar no mapa**.
The camera centers and the actual identity is highlighted. Indoor residents are
located at their exterior exit with a short next-appearance countdown. An absent
hunter is reported as off-map and the rally ground is centered instead. The
camera does not forcibly follow people or interrupt subsequent user panning.

## Logistics and simulation boundaries

Cargo remains the responsibility of dedicated horse-and-wagon crews. Each driver
has one visible representation. The old eight-stop wagon itineraries, timing
formula and road multiplier are retained, now sampled from the saved personal
visual clock. Measuring and caching two wagon paths avoids repeated route-distance
work while drawing. Personal walks do not haul inventories, bill customers, award
wages, alter production, or create new paid work.

These are bounded **local presentation routines**, not full commuting/needs AI.
A person changing job switches to the new workplace's routine. The apparent
indoor/outdoor work schedule does not reduce actual assigned labor availability.
Future continuous job-change travel can be added separately; this update does not
claim that every domestic errand is a fully simulated economic transaction.

Local paths reserve building and roof footprints, leave walls intact at their
real gates, and stay on land. Measured paths and identity plans are reused until
relevant registry/geometry changes occur. Roof clearance and staggered phases were
corrected during local visual review. The human glyph and selected-name overlay
compensate for the existing canvas's unequal horizontal/vertical screen scale;
the underlying map projection has not been redesigned.

The existing 450-resident limit, money, taxes, salaries, food protection, staffing
allocation, construction and stock movement remain unchanged. The only new saved
state is a versioned visual clock. Normal reload is sufficient; never clear player
storage merely to load this update.

## Verification

All nine simulation scripts passed on the final local runtime: existing smoke,
hunting, clarity, legacy comparison, walls, economic transfers and economic soak,
plus the two new daily-life scripts. The new presence suite has 13 test groups.
Its 1,680 sampled 60-second civilian windows (420 identities, four phase offsets,
0.25-second samples) had a minimum of 42 exterior seconds and a maximum of 14
interior seconds. It also covers every job type, children, old/malformed saves,
recall/hunting representation, exact wagon-route positions, collision clearance,
locating, cache reuse and read-only rendering.

A separate complete previous-runtime comparison runs the **active** economy,
not the old test-only fallback. Mature, poverty, hunting, garrison and child
fixtures each replay 480 frames with speed changes and pauses: 2,400 frames total.
Every pre-existing state field compares exactly, excluding only the new visual
clock. Wallets, tax accounts, jobs, stocks and economic timing are not exempted.

Desktop and touch-mobile Chromium checks exercise locating by ID, keyboard access,
paused poses, exact pose restoration, no duplicate financial transactions, and
explicit off-map exceptions. A 65-second local foreground 1x run observed all 450
on-map identities outdoors and actually drew 150 distinct identities in the fixed
neighborhood viewport. The roughly 0.2-second sampling interval recorded a longest
hidden gap of 14.20 seconds, consistent with the exact 14-second routine bound.
No JavaScript errors or accounting discrepancy occurred in that sample.

The GitHub integration gate then passed all nine simulation scripts and all five
real-origin browser suites on the same exact runtime. Its independent 65-second
foreground 1x observation again saw all 450 identities outside and actually drew
150 in the fixed neighborhood viewport: 59.95 fps, 3.16 ms mean/3.70 ms p95 game
work, no frame intervals over 50 ms, no JavaScript errors and zero accounting
discrepancy. Storage used a real local origin in a disposable Chromium profile.
Integration run: https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34166815362

## Host performance, with the new people included

Twelve final-runtime 20-second samples, after three-second warmups, in ABBA order
for overview, fields and neighborhood cameras; two runs per variant/camera.
Same seeded synthetic 450-resident fixture, active economy, requested 10x,
headless Chromium 144 on the same Linux host, mobile-shaped 390x844 viewport,
780x1500 backing canvas and isolated in-memory storage. The table averages run
means and run p95 values; it is not a pooled percentile.

| Camera | Previous mean work | New mean work | Previous/new mean run p95 | Previous/new fps |
|---|---:|---:|---:|---:|
| Overview | 3.54 ms | 4.01 ms | 4.60 / 5.45 ms | 59.41 / 59.41 |
| Fields | 3.03 ms | 2.64 ms | 4.30 / 3.65 ms | 59.91 / 59.88 |
| Neighborhood | 2.97 ms | 2.92 ms | 4.20 / 3.95 ms | 59.94 / 59.81 |

The overview costs about 0.47 ms more average game work; there is no universal
speedup claim. All new samples remained close to 60 fps, with effective simulation
approximately 9.98–10.00x. One new-build frame interval reached 83.3 ms; that sample
is retained. No no-stall physical-device guarantee follows from these short runs.
The separate 65-second local 1x sample averaged 59.98 fps, 2.57 ms mean/3.40 ms p95
work, with no frame intervals above 50 ms. These are host measurements, not Safari,
physical iPhone/Android, battery, heat or mobile-storage certifications.

## Reproduce

```sh
node verification/daily-life-test.js
node verification/daily-life-equivalence-test.js
python verification/browser-daily-life.py
python verification/daily-life-live-soak.py --seconds 65
python verification/performance-daily-life.py --baseline /path/to/df0c05b-index.html --seconds 20
```

The full existing regression suite remains required. Browser scripts accept
`--url` and require served bytes to match the checkout. `--isolated` (or no URL
for the foreground soak) uses disposable in-memory saves where origin serving is
unavailable. Such results are labelled and are not called live Pages verification.
Real-origin acceptance, exact Pages checks and the minute observation are also
included in release workflows; their downloaded evidence is retained privately.

## Still open after this part

Issue #5 remains the economic backlog: paid opportunities for reserves, funded
enterprise accounts, household decisions, property and later banking. The existing
legacy cash-flow bridge and food-assistance dependence have not been disguised by
adding visible pedestrians. Incremental resident-ledger rendering remains a
performance target; this release does not claim to fix the heavier open panel.
Larger populations, full commuting AI, destructive raids and map projection
redesign are not bundled into this visibility change.

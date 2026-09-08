# Map expansion: resumed verification and rendering corrections

Previous live release: `c158b99822563e0f94c5f47ac00391e05de0b1c0`.
Final candidate HTML SHA-256: `1b7e6a932d1574d7e248e6f649b8388ee8352274b5cb2ed0bb3f26ad8e8cc776`.

This accompanies `map-expansion-bastion.md`, which describes the layout and save
migration. Deployment and backup completion are recorded separately in the PR
receipt after exact published-file checks, not inferred from a successful build.

## Recovered checkpoint and publishing failure

The third earlier integration attempt had already passed the complete simulation,
geometry, six desktop/mobile acceptance scripts and a foreground 65-second run.
Its final push failed because the contents-only Actions token attempted to modify
workflow files. The recovery kept the runner's permissions unchanged: it committed
only verified game files; workflow changes were applied through the authorized
connector. The next complete integration succeeded, including the push. Temporary
installers and encoded transfer files are removed before the release merge.

The working source was recovered from the actual pre-release checkpoint and exact
GitHub browser/coast patches. Hashes proved identity with the previously tested
8cffba64 candidate. An additional unfinished checkpoint contained the earlier
movement prototype rather than the map source; it is preserved and correctly
identified rather than treated as sufficient map recovery evidence.

## Three distinct verification passes

1. Export actual runtime geometry: 164 bodies, 115 roofs, 124 road polylines,
   12 reserved plots, 160 site/house frontages, 144 troop/post approach combinations,
   seven gates, four wells, six potable-water polylines, 19 sewer polylines and
   15 housing-row collectors. Body/roof clearance and the separate connected utility
   networks pass. These are geometry/connectivity checks, not hydraulic simulation.
2. Run the existing economy, hunting, garrison and visibility suites plus nine
   historical layout-migration scenes. Preserve identities, balances, stock,
   construction payment/progress and ammunition. Nonspatial active-state comparisons
   run against the real older runtime; geographical differences are intentional.
3. Run all six feature browser suites on desktop and touch-mobile layouts, then
   exact live Pages checks and a 65-second foreground presence observation before
   completing the release backup. Permanent workflows retain their read-only role.

Earlier browser-coordinate and old-save injection problems were corrected without
removing the assertions. Coastal checks now include migrant boats, whole merchant
hulls and the shipyard job endpoint. The incomplete purposeful-movement prototype
is not included in this release.

## Performance correction, without simulation shortcuts

The full-map slowdown was reproduced: the recovered expanded map averaged about
53.2 fps while the previous map was about 59.3 fps. Wall-post batching alone helped
but did not consistently recover the prior cadence, so those intermediate runs
remain in the evidence rather than being selected as the final result.

The final renderer batches non-overlapping, identical wall-post shapes and caches
one screen-sized road layer. All original post coordinates/radii, road commands,
styles and construction progress remain. No population, graphics resolution,
simulation speed, wages or production is reduced.

Camera transformation, backing-canvas size, road tiers, traffic and layout revision
invalidate the road image. Active road construction uses direct drawing at every
progress step. The cache is one RGBA layer, about 4.46 MiB raw in the mobile-shaped
test, capped at 4,194,304 pixels (16 MiB raw); larger canvases or unavailable support
use the direct renderer. Browser/GPU implementation overhead is additional. This is
not a 17,500-by-9,000 world bitmap. Future manual placement must invalidate both
route and paint geometry after confirmation.

Exact command tests cover 48 wall cases and 16 road cases. Chromium additionally
checks 20 wall raster comparisons and 40 road-cache/invalidation cases: all tiers,
panning, zoom, resize, construction, traffic, HTML-canvas fallback and memory-cap
fallback. Batched/transparent-layer edges may have small antialiasing differences;
pixel identity is not claimed. Geometry and state remain exact, with bounded raster
differences explicitly recorded rather than ignored.

## Final paired host sample

Twelve 20-second samples after three-second warmups: ABBA ordering, two runs per
variant/camera, same seeded 450-resident fixture and requested 10x, mobile-shaped
390x844 viewport, 780x1500 backing canvas and in-memory storage. The table averages
run means/p95 values; its p95 column is not a pooled percentile.

| View | Prior/new fps | Prior/new mean game work | Prior/new mean run p95 |
|---|---:|---:|---:|
| Full-map overview | 59.30 / 58.94 | 4.16 / 4.15 ms | 5.65 / 5.60 ms |
| Stronghold | 59.60 / 59.74 | 3.06 / 3.21 ms | 4.65 / 4.45 ms |
| Neighborhood | 59.83 / 59.93 | 3.22 / 3.05 ms | 4.65 / 4.40 ms |

Actual simulation remained approximately 10x and accounting discrepancy was zero.
No final new-build sample had a frame interval over 50 ms; one baseline sample did.
Other earlier samples include slower/long frames and are retained. Forty newly
completed timed samples across recovery and both rendering experiments are saved,
not just the final twelve. The corrected overview is close to the previous game,
not a promise that every view on every phone always runs at 60 fps.

These are host Chromium results. Physical iPhone/Android, Safari, heat, battery,
real-device storage and long-session acceptance remain outstanding. The open
resident-ledger performance issue is not claimed fixed.

## Remaining direction

Manual placement and relocation remain issue #8 and a private Drive to-do. Funded
businesses, productive employment, household/property choices and the legacy-money
bridge remain issue #5. Purposeful work, breaks and paid destination visits still
need rebasing to the new layout and their unfinished save validation. The current
450-resident limit and 56-second local daily-life presentation remain unchanged.

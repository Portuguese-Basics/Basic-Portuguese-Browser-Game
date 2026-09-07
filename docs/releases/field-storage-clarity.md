# Field and storage clarity with staffing optimization

Date: 2026-09-07. Previous release: `d6c8ff05368d4ee5f030268bb376133ecd3c1522`.
Final tested runtime SHA-256: `bc5a61a8ee016a27a369486343ab8fae079224283c3401a43713122cfc6755f0`.

## Player-visible changes

Fields have recognizable grain, vegetable, bean and pasture symbols. Symbols are bounded illustrations, not a new per-plant or per-animal simulation. A separate EQUIPE panel shows assigned workers, available positions and staffing usage. Missing destination storage is identified. Existing field geometry and the pasture's 14 positions are retained.

Stores show resource-specific shelves, actual quantities, real upgraded capacities, fill bars and VAZIO/CHEIO or percentage labels. Multi-resource stores show independent limits rather than an aggregate percentage that hides one full compartment. Tool tiers, weapons, food types, medicine, hides and armor remain distinct. Building inspections include accessible live inventory meters and wrapping layouts.

The 450-resident housing cap, map dimensions, production recipes, wage rules and save format are unchanged. An ordinary reload loads this update; clearing player storage is unnecessary.

## Optimization and correctness

The original staffing allocator body is unchanged, behind exact dependency-signature memoization. Its call closure covers 75 functions and 118 state keys, including nested tools, armor, roads, jobs and relevant expedition cargo. Identical inputs reuse the prior allocation. Changed inputs still recalculate at existing simulation/event boundaries. No 250-ms timer, skipped simulation time or reduced frame-rate setting is used.

Rendering no longer redistributes jobs or tools. The former per-frame allocation runs before drawing, and the former first-draw allocation on load is explicitly preserved outside rendering. The wrapper stores the pre-call signature so tool/staffing feedback still settles as in the original algorithm.

The first candidate exposed a transient initial-load staffing difference in a comparison with an older save. That candidate was not deployed. Preserving the initial allocation fixed it, and the corresponding full previous-runtime regression now guards the behavior. Private save inputs are retained only in the private backup, not this repository.

Verification completed on the final runtime:

- Existing full simulation regression and all 10 militia-expedition groups.
- Nine new clarity/optimization groups, including dependency coverage, 160 seeded mutations with repeated settling, save/reset, read-only drawing and correct inventory limits.
- Exact full-state equality through a 2,400-frame cached-versus-uncached replay with speed changes, pauses, shortages and a hunt. Full allocator calls fell from 2,470 to 62 in that replay.
- Complete previous-runtime comparison, including immediate save loading and 600 frames across mature, shortage and mid-hunt fixtures.
- Desktop and touch-mobile Chromium acceptance for canvas tapping, inventory meters, capacity upgrades, live refresh, layout and hunting. No JavaScript errors in those checks.

Final integration verification: https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34130404900

## Final-build paired performance measurements

Eight 20-second timed runs, in ABBA order for each of two fixed cameras, after three-second warmups. Same seeded synthetic 450-resident fixture, requested 10x, headless Chromium on the same Linux host, mobile-shaped viewport, capped 780 x 1500 game canvas and isolated in-memory storage. Two runs per variant/camera. The table averages the two run means or run percentiles; it is not a pooled percentile.

| Camera / metric | Previous runtime | Combined final runtime |
|---|---:|---:|
| Overview: mean game work | 6.20 ms | 4.44 ms |
| Overview: mean of run p95 work | 8.45 ms | 6.35 ms |
| Overview: callback cadence | 57.95 fps | 59.13 fps |
| Overview: effective requested 10x | 9.983x | 10.000x |
| Fields: mean game work | 5.93 ms | 4.15 ms |
| Fields: mean of run p95 work | 8.65 ms | 6.90 ms |
| Fields: callback cadence | 59.44 fps | 59.05 fps |
| Fields: effective requested 10x | 9.995x | 9.996x |

Mean game work decreased 28.3% in the overview and 30.1% over the fields with the new graphics included. This is lower CPU-side work, not a 30% frame-rate increase. Some long frames still occurred: the combined runs contained four frame intervals above 50 ms in total, including one 65.5-ms work sample. The small field-view cadence decrease and all unfavorable samples are retained. These results do not certify the proposed no-stall physical-device gate.

An earlier candidate also showed lower mean work; its results remain separately labeled with its own runtime hash. No physical iPhone/Android hardware, Safari, thermal behavior, battery drain or real storage latency was benchmarked. No larger colony was enabled by this release.

## Reproduction and release checks

```sh
node verification/smoke-test.js
node verification/militia-hunts-test.js
node verification/clarity-test.js
node verification/baseline-equivalence-test.js
python verification/browser-hunts.py
python verification/browser-clarity.py --url http://127.0.0.1:8765/
python verification/performance-clarity.py --baseline /path/to/previous/index.html --seconds 20
```

The baseline-equivalence test needs Git history for the pinned previous release. Use a full checkout. The clarity browser test requires the indicated local server; `--isolated` is available for a no-origin, in-memory functional check.

Permanent read-only workflows run all four simulation suites and both browser suites with fail-fast pipelines. The published-release verifier requires exact served HTML bytes before testing the live Pages build in isolated contexts. Temporary integration workflows are removed before merging. Release source, history, raw samples, environment records, comparison logs, screenshots and prior backups are retained in the established private Drive project after publication is verified.

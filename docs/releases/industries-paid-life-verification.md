# Funded industries: verification and measured limits

Final runtime SHA-256: `08ecc9d1be551d659ccc3f0d5b9038c8c9a97591c13b0cac3143b9c7a545d548`.
Baseline main: `2c2069da81651b667c9e907ef07cdbd855c635d2`.
Feature remains opt-in through **Empresas e lazer → Autorizar economia e obras**.
The functional/accounting tests passed; the no-noticeable-performance-degradation
objective is **not fully met**. See issue #10. This is not an unconditional promise
of 450 permanent paid jobs or profitable firms on every save.

## Active economy and staged construction

The completed integration replay used a synthetic 450-adult colony with 20,000
gold in the town treasury. All new buildings started unbuilt; their capital,
materials and completed construction labor were paid through the implementation.
The 180-cycle run represents three simulated hours and includes nine reloads.
It is not three hours of physical-phone observation.

All ten businesses became active by cycle 74. Treasury cash never became negative:
minimum 2,777.78, final 33,949.13 gold. The last twenty cycles added 5,912.62 gold.
Health stayed at 100, hunger and military wage arrears stayed zero, and the global
money reconciliation was zero at every checkpoint. These treasury results include
the established colony's other receipts and expenses, not just new taxes.

At the end there were 117 regular core paid roles and 333 reserve residents with
local pay in the previous ten simulated minutes. No adult lacked both kinds of
income in that window. This is recent-income coverage via rotating contracts,
NOT 450 simultaneous permanent salaries. Coverage first reached everyone at cycle
14 but briefly dropped again before remaining complete in the mature run.

New local wages totaled 12,428.20 gold. Capital transfers totaled 2,460, existing
maintenance redirected to local contracts 13,569.54, returned contract funds
3,734.31, and business dividends 1,916.36 gold. Those categories are separately
recorded: a returned advance is not a sale, and a capital transfer is not profit.

New taxable sales principal was 6,208.36 gold, with 558.7524 to town sales tax and
62.0836 to player tax. Explicit bounded external export principal was 1,557.60.
There were 304 completed freight deliveries, 2,485 paid visits, 19,690 completed
local shifts, ten festivals and 491 cancellations recorded by the system. An
unfulfilled visit is never counted as a taxed delivery.

Available food still reaches poor residents. Across the replay, 74,712 nutritional
units were purchased and 6,288 were provided in kind (7.76% assistance overall;
6.96% in the last sixty cycles). Earlier stage-one trials had much higher reliance
on assistance, but those older runs are not an identical paired experiment. Do not
present that comparison as a universal percentage reduction.

Every business retained positive cash at the final checkpoint. Final cash ranged
from 160.80 at the festival venue to 360 at the theater. This finite run is not
proof of indefinite profitability; quarry depletion, changing demand, additional
construction and a different population can change the outcome. Initial cheaper
beer/festival prices had depleted venue cash; those failed attempts remain in the
private evidence. Final prices were then tested from fresh staged construction.

The final synthetic save was 757,701 bytes. Journal histories remain bounded.
Identity, household membership, escrow, outstanding cargo, current activities and
all money accounts are checked across reloads. The old loader's zero-time registry
rebuild is respected rather than omitting household members to hide differences.

## Functional, geometry and browser coverage

The suite includes the original twelve simulation/renderer scripts, 23 industry
transaction and lifecycle groups, the staged economy replay, and a 720-frame
comparison of optimized versus original industry scheduling. That last comparison
matches the complete state with no excluded fields. Tests against the old runtime
first require the newly introduced extension to equal its inactive default; no old
wallet, tax, inventory, work or household field is excluded from those comparisons.

Independent geometry checks cover ten new business footprints, three public spaces,
and 3,263 destination routes, alongside existing road/gate/water/sewage checks.
Ground movement uses existing land, entrances and gates. No water-pressure or
sewage-flow simulation has been introduced.

Seven feature browser suites cover hunting, storage clarity, walls, citizen
accounts, daily life, the expanded map, and funded industry. Industry checks use
both desktop and touch-mobile Chromium contexts and exercise keyboard/canvas
selection, a real capital debit, a customer travelling before service, a mid-trip
reload, a 1.54-gold delivered beer payment and no repeat payment on reload.
Synthetic completed venues in that focused UI test are explicitly not construction
solvency evidence; the separate 180-cycle replay supplies that evidence.

The 30-case industry scenery test compares direct and cached output, invalidation,
fallback and read-only behavior. At most two channel values differ at a tiny set
of antialiased edge pixels; that is recorded, not called byte-identical artwork.
The existing wall/road raster and geometry tests remain required.

The full integration run passed before the final drawing-only overview fallback:
https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34238157538
The final fallback passed the industry unit, raster, UI and foreground checks:
https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34240077819
Final-head CI and exact published-byte verification remain release requirements.

## Actual foreground activity, not only advanced test clocks

A separate 65-second foreground 1x Chromium run used a disposable real local origin,
completed synthetic buildings, seeded goods and cash transferred from the treasury.
It observed 359 identities with new activities; 338 moved more than twenty world
units. During real foreground execution, completed work paid 92.40 gold and eighteen
paid visits finished. Reload preserved the complete industry and citizen accounts.
No JavaScript errors or accounting discrepancy were recorded.

That run averaged 59.87 fps, 2.52 ms mean / 3.90 ms p95 game work and 0.9993x
simulation, but had TWO frame intervals above 50 ms. The local in-memory counterpart
had ten such intervals. Neither is a no-stall guarantee. The legacy automatic
construction camera may refocus during activity; the closing screenshot is
recentered on the tavern only after measurement and pause. World-wide movement
counts do not imply that all those people were on one screen simultaneously.

## Performance: explicit remaining cost

Four complete fourteen-run matrices (56 samples) plus shorter rejected probes are
preserved privately. The final matrix used Chromium 144 on the same Linux host,
390x844 mobile-shaped viewport at DPR2, a 780x1500 backing canvas, 15-second samples
and warmups. Baseline and industry variants use corresponding synthetic mature
states, but the baseline does not simulate the new businesses. The comparison is
end-user workload cost, not a pure rendering microbenchmark. Percentiles below
average the two run percentiles; they are not pooled percentiles.

| View | Baseline / industry fps | Baseline / industry mean work | Baseline / industry mean run p95 |
|---|---:|---:|---:|
| Full overview | 50.87 / 44.40 | 4.63 / 7.10 ms | 7.90 / 14.05 ms |
| District | 58.88 / 58.20 | 3.08 / 5.00 ms | 5.85 / 9.60 ms |
| Resident register | 58.37 / 58.64 | 2.91 / 5.02 ms | 5.30 / 9.65 ms |
| Business panel | — / 58.78 | — / 4.70 ms | — / 8.75 ms |

Actual requested 10x advanced about 9.85–9.93x in these views. Long frame intervals
occurred; all unfavorable results remain. The full overview is a known high-priority
performance issue (#10), and the p95 budget remains unmet in other views even when
average fps is near sixty. Physical iPhone/Safari, representative Android, sustained
thermal behavior, battery and real-device storage remain untested.

The implemented optimizations reuse per-tick identity and occupancy indexes and
cache only bounded static industry scenery at close zoom. The queue optimization
passes the exact full-state comparison. One viewport-sized scenery layer is capped
at 16 MiB of raw pixels and falls back to direct drawing without canvas support or
above the cap; the existing road layer has its own cap. At overview zoom, sparse
scenery is painted directly rather than copied as another full-screen bitmap.
Moving people are not hidden or frozen, and no simulation time/resolution is removed.

Affine, sprite, atlas and route-attachment experiments that performed worse were
rejected and are not in this runtime. Future improvements must preserve real people,
fulfilled payments, inventory custody, movement and simulation-speed accounting.

## Continuity

Issue #5 remains open for private ownership, household/property decisions, banking,
further productive demand and replacing the old cash-flow bridge. Manual placement
is #8. This stage supplies real local work/break/visit activity, but not universal
arrival-gated production for every legacy worksite. Keep the financial and map
recovery chain in private Drive; do not publish real player saves or private briefs.

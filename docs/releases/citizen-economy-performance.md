# Citizen economy stage 1: verification and performance

Date: 2026-09-07. Previous runtime: a47830faae4c4c17e680dead01932e9014dbdf14.
Final HTML SHA-256: `00174c69489a642df70c9ca95c161ff0ea8080b6c5d9ced0fdde2a53890f64d9`.

## Scope and functional evidence

Twenty new economic regression groups pass, along with existing food/housing,
hunting, walls and staffing tests. Active economy tests cover funded transfers,
partial payroll, arrears, identity continuity, actual stock, private service
income, 9%/1% taxes, fractional clearing, poverty relief, house exemptions and
bounded journals. Old-runtime equality explicitly disables the new economy in
isolated comparisons; it is legacy-mode coverage, not an assertion that the
active economic update behaves identically to the old abstract money model.

A 450-adult replay completed 180 cycles (10,800 simulated seconds), with six
reloads, zero money discrepancy at every cycle, health 100 and no physical food
shortage. It is an API replay, not a physical three-hour or thermal test. End
wallets totalled 24,557.40 gold, town cash 9,246.24, cumulative wages 29,914,
private service income 180, town/player sales tax 417.60/46.40 and house-tax
receipts 389.34/43.26. The final save was 475,284 bytes.

The same replay delivered 22,300 paid and 58,700 social nutritional units.
Many adults remain unpaid labor reserves; names and money records do not create
jobs. Issue #5 prioritizes genuinely productive private income and enterprise
accounts while retaining food protection.

## Exact final-build host measurements

Eight ABBA-ordered 15-second samples, two per build per camera, after 3-second
warmups. Identical seeded 450-adult fixtures, requested 10x, 390x844 CSS viewport,
780x1500 canvas. Chromium 152 on a Linux GitHub runner using software graphics;
map benchmarks isolate storage in memory. Values below average the two run means
or percentiles, not pooled percentiles.

| View / metric | Previous walls release | New economy |
|---|---:|---:|
| Overview frame callbacks | 55.95 fps | 57.19 fps |
| Overview mean game work | 5.43 ms | 4.93 ms |
| Overview mean run p95 | 6.30 ms | 6.70 ms |
| Overview mean run p99 | 15.80 ms | 17.30 ms |
| Overview effective 10x | 9.991x | 9.993x |
| Fields frame callbacks | 59.92 fps | 59.72 fps |
| Fields mean game work | 4.68 ms | 4.20 ms |
| Fields mean run p95 | 5.30 ms | 4.90 ms |
| Fields mean run p99 | 14.10 ms | 16.75 ms |
| Fields effective 10x | 10.003x | 9.998x |

No >50-ms frame interval occurred in these eight map samples. Lower mean work
is not a guaranteed FPS gain: overview tail work increased and field cadence
slightly fell. The real military reservation also changes the workload compared
with the former extra/duplicate civilian capacity. Do not attribute every timing
difference to the ledger's number-formatting reuse.

A separate 90.13-second foreground test kept the register open on a real HTTP
origin with disposable browser storage. It measured 51.00 fps, mean game work
5.75 ms, p95 8.50 ms, p99 14.00 ms and effective 9.987x. Seven frame intervals
exceeded 50 ms; the worst was 83.3 ms. All nine accounting/census checkpoints
balanced, and there were no JavaScript errors. This does NOT meet a strict
no-stall/8-ms-p95 certification and is not hidden behind the closed-map averages.
An earlier 60-second candidate run measured 53.25 fps and p95 9.3 ms. Different
runner samples and durations do not establish a causal FPS improvement.

The final formatter reuses one Intl.NumberFormat instance and is regression-tested
for identical monetary text. There is no change to financial calculations, the
four-Hz refresh ceiling, simulation speed or frame cap. The register still needs
physical-device profiling and incremental DOM/summary updates as it grows.

## Preserved evidence and limits

The private Drive archive preserves all 24 map samples: eight noisy local
preliminary samples, eight first-candidate GitHub samples and eight exact-final
GitHub samples, plus both real-origin foreground ledger traces. The unfavorable
local field sample is retained. Original briefs and old player-save probes remain
private; none are placed in this public repository.

No physical iPhone/Android, Safari, battery, sustained heat, total browser memory
or device-specific storage capacity has been certified. The existing 450-person
cap and map size remain unchanged. Individual balances and cumulative totals
persist, while journals are intentionally bounded; this is not an unlimited
historical accounting database or a fully closed enterprise economy.

Integration: https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34160819313
Final runtime verification: https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/actions/runs/34161449245
Follow-up work: https://github.com/Portuguese-Basics/Basic-Portuguese-Browser-Game/issues/5

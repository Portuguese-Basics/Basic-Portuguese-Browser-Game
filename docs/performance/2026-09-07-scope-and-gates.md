# Performance gate: field and storage clarity

Date: 2026-09-07
Audited release: `d6c8ff05368d4ee5f030268bb376133ecd3c1522`
Runtime SHA-256: `a30767c7518f07ded2dcae69aec18df0f083aa65caab5e51a457d12d856361ed`

## Requested next update

Make fields and stores visually clearer: distinguish item types, capacity and usage without compromising the current smooth play experience, including 10x simulation.

This branch records the audit and acceptance criteria. It does not change `index.html`, the live colony economy, save format, population cap or deployment configuration. Experimental graphics and staffing changes remain isolated test workloads, not an approved release.

## Definitions that must remain distinct

- Supported colony: currently 90 houses at five residents each, or 450. Larger injected populations are workload tests, not sustainable or playable expansions.
- Field usage: staffed positions divided by available positions. It is not planted-tile coverage or a guarantee of output; tools, inputs, processing and logistics also matter.
- Store fill: actual inventory divided by that store's current upgraded capacity.
- Throughput: delivered/processed output over time, not nominal inventory or staffing.
- Hardware headroom: time, memory and thermal budget remaining on a measured device. A processor name or desktop CPU-throttling factor is not a device benchmark.

## Initial source findings

The animation callback scales elapsed simulation time rather than executing the complete frame loop ten times. Economic 60-second cycles therefore occur approximately every six real seconds at 10x. Frame delays above 50 ms are clipped by the current loop, so apparent 10x can lose simulation time under overload. Measure effective simulation speed as well as frame cadence.

Staffing is recalculated inside colonist drawing on every rendered frame, in addition to simulation/event paths. This is a candidate for a carefully tested state-driven cache, not permission to delay arbitrary game updates. The isolated experiment reduces only render-triggered allocation frequency; equivalence has not yet been established.

The map is a 14,000 by 9,000 coordinate space. The displayed canvas uses viewport dimensions and caps device-pixel ratio at two. Enlarging coordinate bounds is not equivalent to multiplying active buildings, routes, citizens or visible pixels. Avoid a full-world high-resolution bitmap cache.

## Proposed acceptance criteria

These are project engineering targets, not measured guarantees or universal browser limits.

- Aim for 60 fps on the chosen supported-device floor; proposed 95th-percentile game frame work <=8 ms, with browser/thermal reserve. Use a deliberately selected 30-fps economy mode only where needed, not an unexplained downgrade.
- Preserve at least 9.8 simulated seconds per real second during a foreground 10x measurement. Report long frames and repeated stalls, not just average fps.
- Keep interactions responsive: target immediate feedback below 100 ms and verify field INP separately. A frame timing sample is not an INP measurement.
- Compare the same save, camera, speed, browser, brightness, battery mode and temperature. Include a 15-minute physical-device soak, cold route caches, panning, inspections, hunts, construction and autosaves.
- New artwork should use bounded samples, cached icons and capacity gauges; never one animated object per stored resource. Start with a small explicit frame-time allowance, not an unlimited detail multiplier.
- No simulation, staffing, food, payroll, housing, transport, save or hunt regression may be accepted in exchange for faster drawing.
- Keep all raw results, source identity, environment, experimental code, input brief and backup verification in the established Drive project.

## Measurement limits

The available local lab uses headless Chromium, a desktop/server CPU, software rendering, a synthetic mature-colony fixture and in-memory test storage. CPU slowdowns are relative to that host. They do not measure physical iPhone/Android GPU performance, Safari/WebKit, real storage I/O, thermal throttling, battery drain or browser tab-reload limits. Named-device capacity estimates must remain provisional until measured on those devices.

## External methodological references

- Chrome rendering budget: https://web.dev/articles/rendering-performance
- Chrome throttling calibration and limitations: https://developer.chrome.com/blog/devtools-grounded-real-world/
- Canvas optimization: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

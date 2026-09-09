# Industries physical-device acceptance kit

This kit prepares an isolated fictional colony for testing the exact candidate on an actual iPhone using Safari and a representative mid-range Android phone using Chrome. Both physical-device results begin as **NOT_TESTED**. A desktop window shaped like a phone, CPU throttling, headless Chromium, or headless WebKit does not establish a physical-device result.

## Prepare the candidate and fixture

Use the candidate's full Git checkout and recorded Node version. Run these commands from its root, or use the byte-verified fictional fixture supplied in its review package:

```sh
node verification/industry-soak-test.js
python3 verification/device-kit-serve.py --repo . --fixture verification-output/industry-soak-save.json --port 8877
```

The existing soak script creates `verification-output/industry-soak-save.json` from a generated colony. It is not a player's save. Retain its generation log, candidate commit, seed and fixture SHA-256 with the device result. The server reads only `index.html` and that fixture, holds the exact runtime bytes in memory, and serves four fixed routes. It does not serve the checkout or other filesystem paths.

The runtime uses `crypto.randomUUID()` when creating family and child identities. Browsers expose this API only in a secure context. HTTP loopback origins such as `http://localhost` and `http://127.0.0.1` can qualify when the browser runs on that same computer. A phone visiting another computer's LAN address over HTTP does not have that loopback exception. The installer checks both `isSecureContext` and actual `crypto.randomUUID` availability, and blocks fixture installation and its game link when either is missing. [MDN randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

For an authorized phone on a trusted private LAN, provide an existing certificate chain and matching private key. The phone must already trust the certificate for the exact hostname it opens. Supply both files, keep the key outside the repository and evidence archives, and run:

```sh
python3 verification/device-kit-serve.py --repo . --fixture verification-output/industry-soak-save.json --bind 0.0.0.0 --port 8877 --certfile /PATH/TO/provided-chain.pem --keyfile /PATH/TO/provided-key.pem
```

The server uses Python's TLS server context and the supplied certificate/key pair. It does not generate certificates, install trust, bypass browser warnings, patch the game's UUID implementation, or upload the key. Use a PEM key that needs no interactive password; unsupported or mismatched inputs fail at startup. [Python SSLContext](https://docs.python.org/3.12/library/ssl.html#ssl.SSLContext.load_cert_chain).

Open `https://CERTIFICATE-HOSTNAME:8877/` on the phone, or `http://localhost:8877/` for a same-computer loopback test. Confirm normal certificate validation and the installer's secure-context/API checks. Do not click through certificate errors or disable browser security. If a trusted hostname/certificate or necessary network access is unavailable, record the physical setup as blocked and physical acceptance as **NOT_TESTED**. No public deployment or certificate provisioning is required by this kit.

Use a new private browsing context and an unused port for each clean trial. The installer refuses to replace existing storage, initializes the fictional save before the first game script, and displays the exact runtime and fixture identities. Open the game using its enabled link. Ordinary game autosave and reload operate on this separate test origin. Do not clear an existing game/profile to make a fixture load. Do not publish this server or use the live game's origin.

Record whether private browsing, normal isolated storage, charging, battery saver, screen recording, thermal state, or remote inspection were used. Preserve the default rendering resolution and native device pixel ratio. Report refresh rate if exposed. Leave unsupported memory, fps or frame-time measurements blank / N/A; an impression of smoothness is not an fps measurement.

## Device record

Complete one separate record for each actual device, using `verification/device-result-template.json` as a starting point. Include:

| Field | Required observation |
|---|---|
| Hardware | Exact manufacturer/model and RAM if known; physical device, not emulation |
| Software | Exact OS version/build and browser version/build; record Safari's OS association |
| Candidate | Full commit, runtime bytes/SHA-256, fixture bytes/SHA-256, review-package reference |
| Display | Portrait/landscape viewport, device pixel ratio, refresh rate if available |
| Conditions | Battery %, charging/power mode, warmup, room/device temperature if known, foreground visibility |
| Secure context | Actual URL scheme, certificate validation without bypass, `isSecureContext` and `crypto.randomUUID` availability reported by the installer |
| Timing | Wall-clock start/end, requested 1×/10×, measured simulated-time delta if observable |
| Evidence | Timed screenshots/short recording, exported test storage, errors, observed stalls |

Do not publish raw device records or screenshots containing personal/device information in the public repository. Keep them with the private review evidence.

## Execute the sequence

1. Confirm the displayed candidate hash and fixture hash. Open the colony; record its initial treasury, accounting discrepancy, population, business count and active contracts. At 1×, pause and resume using the game controls.
2. Warm the foreground game for at least five minutes before the sustained session. Keep the phone awake and the tab visible. Record any thermal/power changes. Do not reduce population, hide actual actors, lower rendering resolution, or freeze off-camera work.
3. Observe 1× for at least 65 seconds in a busy residential/industrial district. Follow an actual named worker to paid work and a break, a carrier collecting and delivering actual cargo through the relevant gate, and a customer completing service. Record identity, actual destination and observed settlement; mark any event that was not reached as incomplete. Include a poor/unemployed resident using free public space without a sale or invented wage.
4. Run a continuous 15-minute warmed foreground session, including at least five minutes at 1× and five at 10×. Include full overview, close district, brewery/tavern/theater, resident register, business panel and pan/zoom. Record each interval's actual duration and requested speed. For quantified acceptance, repeat each priority view at least three times with at least 60 seconds per measurement and reversed version order; use production, untouched industry and candidate with matched fictional state and record unavoidable gameplay differences.
5. In portrait and landscape, open both panels, scroll, search, select and locate the same identity during a trip and on site. Keep a control focused while balances refresh. Confirm readable rows, retained scroll/focus, reachable close buttons and useful touch targets. Test tap versus drag, pinch zoom, expansion controls and browser rotation. Do not infer accessibility behavior solely from a screenshot.
6. Pause during an actual trip or funded shift. Record identity, phase/progress, balances, escrow and cargo where observable. Reload normally while paused, then compare after normal initialization. Resume through one settlement and reload again; verify no duplicate settlement and no lost person, balance or cargo. Export the synthetic accounting data from the game, and optionally return to the installer to download the current test storage. Returning uses the game's ordinary page lifecycle; it does not install a new fixture over autosave.
7. Repeat with optional purchases paused and, on a new fictional trial, the extension disabled. Confirm newly issued discretionary venue payroll stops when purchases are paused while already funded shifts complete. Existing essential jobs and the rest of the colony must continue. Record whether construction safely defers under insufficient funding, rather than treating deferred expansion as a crash.

## Assess and retain

The mission's host targets are at least 58 fps on a 60-Hz-capable reference, p95 game work at most 8 ms, p99 game work below 16.7 ms, and effective 10× speed at least 9.8×. Keep frame intervals separate from application work. Record >33.3/50/100-ms frame counts and every >100-ms event when actual instrumentation is available; do not invent zeros when it is not. Keep all adverse samples, including thermal slowdown and save/panel stalls.

Money discrepancy, lost/duplicated people or goods, save corruption, blocked controls or broken gameplay fail the affected check. Missing instrumentation is `NOT_MEASURED`; missing hardware is `NOT_TESTED`. A completed manual observation without quantified metrics is `OBSERVED_ONLY`, not a performance pass. Retain the smallest concrete failing reproduction and exact candidate/fixture identities. This kit authorizes no merge or live release and does not close performance issue #10.

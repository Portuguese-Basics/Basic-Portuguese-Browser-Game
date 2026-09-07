# Manned walls: final host performance evidence

Runtime SHA-256: b33b52d820e2d1b7f07bc9907270e8e0651c3fd712bf6a79400a5e79a171a761.
Previous runtime: 9529f0ce8cc1f43c962f0e665a0ad9ced15c5519.

The 450-resident synthetic fixture has 30 existing defenders and requested 10x
simulation. Previous code has completed stone walls; new code has eight completed
parapet sides with the defenders stationed. Desktop-hosted Chromium, phone-shaped
390x844 viewport and capped 780x1500 canvas, software rendering and in-memory
storage. No physical-phone, Safari, battery, heat or real-storage result is implied.

Eight final 20-second requested samples used ABBA ordering, two runs per build
per camera. Three-second warmups precede each sample. The clean overview pairs
averaged about 4.00 ms of game callback work before and 4.08 ms after, with mean
run-p95 work of 5.20 and 5.15 ms respectively. Callback cadence was about 58.7 and
58.6 fps, and effective simulation was approximately 10x. This small difference
is within a noisy host experiment, not proof of zero added cost or a phone guarantee.

New-build final runs across both cameras recorded roughly 58-60 fps and 3.33-4.16 ms
mean game work. Two additional exercise-only runs recorded about 59.9-60.0 fps,
3.23-3.33 ms mean work and 4.1-4.2 ms p95. Their camera differs from the overview;
these are not evidence that combat is faster than idle. No interval over 50 ms
was recorded in those six final new-build runs. Effective-speed estimates can be
slightly above 10x because the sample boundaries cut across a simulation frame.

One final baseline tower run suffered a 21.55-second host interruption, extending
its requested 20-second sample to about 40 seconds. It is retained but excluded
from comparative conclusions; averaging it would manufacture a false speedup.
An earlier eight-run pilot is also retained and labelled: its later runs overlapped
with other host CPU work. All 18 complete samples, raw timings, environment data,
source and classifications are preserved in the private Drive release evidence.

The implementation bounds active records to 30 defenders, 48 possible stations,
six exercise targets and 64 in-flight arrows. Drawing remains read-only, offscreen
fortress details are culled, and panel updates are bounded. Existing staffing
snapshot reuse remains in place. The 450-resident limit and map size are unchanged.

Reproduce from the repository root:

```sh
python verification/performance-walls.py --baseline /path/to/9529f0c/index.html --seconds 20
python verification/performance-walls.py --baseline /path/to/9529f0c/index.html --seconds 20 --exercise
```

Use the full environment and raw records when comparing future releases. These
short host samples do not replace sustained on-device testing.

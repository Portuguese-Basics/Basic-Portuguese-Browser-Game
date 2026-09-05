# Basic Portuguese Browser Game

It all started with a dot that was an archer. The project is now a buildless,
single-page settlement and colony simulation with a Brazilian Portuguese
interface and deliberately minimal canvas graphics.

The in-game clock can run at 1×, 2×, 5×, or 10×. Accelerated time advances
passive production and colony systems while hunting and direct actions remain
at normal real-time speed.

The colony now includes proactive three-district housing, a food-first economy,
healthcare and sanitation, preserved-food reserves, stone fortifications,
controlled migration, and bounded aging and mortality. Resource gatherers keep
their output at the source. Whenever production or source backlog exists, the
transporter company protects a six-wagon operating crew and scales up to 12
dedicated horse-and-wagon teams as flow and delay rise. Mixed loads move to
storage and production buildings under the sustainable essential-payroll limit.

Mature construction is performed only by a four-to-twelve-person guild crew.
Established specialists retain their jobs, and idle builders return to the
general labor reserve. Every productive worksite has one tool rack position per
worker: no tool yields 60% output, wood 100%, stone 115%, and iron 130%. Better
tools are assigned first and automatically displace lower tiers to other sites.

An emergency save migration stabilizes an existing colony below 80 health once,
supplies herbs and medicine, and pauses mortality for three cycles. Thereafter,
clinic, herb, transport, water, sanitation, and fire-service staffing sustain
health through the normal economy rather than recurring grants.

Play the public version:
https://portuguese-basics.github.io/Basic-Portuguese-Browser-Game/

Development remains centered on `index.html`. Run the complete regression suite
before publishing:

```sh
node verification/smoke-test.js
```

The ordinary run includes the 450-resident housing, food-job, food-output,
payroll, maintenance, and operating-balance audit. Supplying an exported save as
the first argument additionally prints a `LIVE_SAVE_AUDIT` report for that exact
colony.

GitHub `main` is canonical. The existing Google Drive ZIP is updated in place
only after the GitHub Pages release has been verified. Existing browser and
transferred saves must remain compatible.

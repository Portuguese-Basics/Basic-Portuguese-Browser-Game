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
their output at the source. Whenever staffed production can reach storage or a
deliverable source backlog exists, the transporter company protects a six-wagon
operating crew and scales up to 12 dedicated horse-and-wagon teams. Full
destinations no longer create phantom logistics jobs. Mixed loads move under the
sustainable essential-payroll limit.

Food staffing is based on measured end-to-end output rather than nominal field
headcount. The allocator compares the marginal production of crops, pasture,
fishing, kitchens, preservation, bread and meat chains with their actual tool,
road, boat, processing and wagon constraints. It fills the most productive
sustainable combination until the colony has a 20% operating buffer, or until
the essential-payroll ceiling is reached; unused food slots then remain visible
as reserve capacity. During hunger or a sub-cycle food reserve, the target rises
to 40%. The expanded pasture now reaches the agricultural road, retains its
southern boundary, animates the whole plot, and supports 14 herders instead of
10.

Mature construction is performed only by a four-to-twelve-person guild crew.
Established specialists retain their jobs, and idle builders return to the
general labor reserve. Every productive worksite has one tool rack position per
worker: no tool yields 60% output, wood 100%, stone 115%, and iron 130%. Better
tools are assigned first and automatically displace lower tiers to other sites.
Those same tiers now govern wagon capacity: untooled, wood, stone, and iron
transport crews carry at 60%, 100%, 115%, and 130% efficiency in addition to
their road bonus.

Funded stone projects automatically reserve enough quarry labor to close their
material shortage before construction begins. A built fire station keeps at
least one firefighter, while an undersupplied smokehouse keeps two preservers
until smoked-meat and dried-fish reserves reach 25% of one consumption cycle.
Existing defenders also equip compatible stockpiled armor immediately, with
leather issued to unarmored militia first. Stone-upgraded inner warehouses now
restore their full 150-hide inventory from existing saves.

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

The ordinary run includes the 450-resident housing, 76-position food-capacity,
food-output, payroll, maintenance, pasture/road geometry, and operating-balance
audit. Supplying an exported save as the first argument additionally prints a
`LIVE_SAVE_AUDIT` report for that exact colony.

GitHub `main` is canonical. The existing Google Drive ZIP is updated in place
only after the GitHub Pages release has been verified. Existing browser and
transferred saves must remain compatible.

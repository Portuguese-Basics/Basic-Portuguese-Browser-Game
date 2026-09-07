# Basic Portuguese Browser Game

It all started with a dot that was an archer. The project is now a buildless,
single-page settlement and colony simulation with a Brazilian Portuguese
interface and deliberately minimal canvas graphics.

The in-game clock can run at 1×, 2×, 5×, or 10×. Accelerated time advances
passive production and colony systems while direct actions remain immediate.
The adjacent pause control freezes simulation and combat clocks without
blocking map inspection, panels, save transfer, or automatic saves.

The colony now includes proactive three-district housing, a food-first economy,
healthcare and sanitation, preserved-food reserves, stone fortifications,
controlled migration, and bounded aging and mortality. Resource gatherers keep
their output at the source. Whenever staffed production can reach storage or a
deliverable source backlog exists, the transporter company protects a six-wagon
operating crew and scales up to 12 dedicated horse-and-wagon teams. Full
destinations no longer create phantom logistics jobs. Mixed loads move under the
sustainable essential-payroll limit.

Every productive, storage, civic, logistics, military, housing, well, and guard
building on the colonial canvas is inspectable with a short tap or click. The
mobile-friendly dialog reports construction/operating status, assigned workers,
vacancies, tool tiers and productivity, current recipes or output, inventory
against capacity, and building-specific operational data. The figures refresh
while the dialog is open. Dragging and pinch zoom remain map navigation.

Militia hunting expeditions start at the flagged rally point immediately north
of the hunting lodge in the northwest, or through **Caçada da milícia**. Choose
1–10 available militia and 60, 120, or 240 seconds of actual hunting time. The
party visibly gathers (45 seconds), leaves the map (18 seconds), hunts off-map,
returns with animal silhouettes and meat/hide loads (18 seconds), unloads at the
lodge (8 seconds), and walks back to the training yard (45 seconds). These are
simulation seconds: all stages respect pause and the 1×/2×/5×/10× controls.

Yield scales with militia-person-seconds spent hunting, with broad seeded
variation, occasional nearly empty hunts, and occasional exceptional returns.
The seed and progress are saved, so resuming cannot reroll a hunt or award its
cargo twice. Deployed militia retain their wages and equipment but stop adding
to town security until they return. Guards and professional soldiers stay home.

Whole animals, raw meat, and hides are recorded separately. Up to two whole
animals per colony cycle can be processed by staffed butchers; each costs one
butcher operation and produces four raw meat and two hides. That labor is
subtracted from ordinary meat processing and its food-output forecast. Meat
enters the existing source stock and still needs wagon transport. Hides fill the
existing capped hide stock. Overflow stays in a bounded, saved lodge backlog;
it is neither silently discarded nor paid as gold. The next hunt waits for the
previous cargo to clear. The panel reports each stage, pending cargo, and the
last result. Hunts are optional windfalls, not guaranteed recurring food output.

Fields now distinguish grains, vegetables, beans and pasture with bounded,
recognizable symbols. A separate EQUIPE indicator shows assigned workers and
available job positions; the crop and animal symbols are illustrative, not a
claim about the number of plants or animals simulated. Unavailable storage is
shown explicitly. Field geometry, production rates and the 450-resident cap are
unchanged.

Storage has resource-specific shelves with actual quantity, upgraded capacity,
a fill bar, and VAZIO/CHEIO or percentage labels. Multi-resource stores display
separate limits rather than a misleading combined percentage. Building
inspection inventories also include accessible, live-updating meters.

Drawing no longer allocates jobs or redistributes tools. The original allocator
is retained behind exact state-signature memoization. Relevant changes still
recalculate immediately at existing simulation/event call sites; there is no
250-ms timer or skipped game time. The pre-call signature preserves feedback
settling between tools and staffing. New dependency coverage, mutation/replay
and read-only drawing regressions protect this optimization.

Food staffing is based on measured end-to-end output rather than nominal field
headcount. The allocator compares the marginal production of crops, pasture,
fishing, kitchens, preservation, bread and meat chains with their actual tool,
road, boat, processing and wagon constraints. It fills the most productive
sustainable combination until the colony has a 20% operating buffer, or until
the essential-payroll ceiling is reached; unused food slots then remain visible
as reserve capacity. During hunger or a sub-cycle food reserve, the target rises
to 40%. The expanded pasture now reaches the agricultural road, retains its
southern boundary, animates the whole plot, and supports 14 herders instead of
10. A population-scaled pasture baseline keeps livestock and hides flowing;
full raw-meat stores temporarily reserve matched butcher and meat-kitchen crews
to clear the bottleneck into protected high-value meals.

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
node verification/militia-hunts-test.js
node verification/clarity-test.js
```

The ordinary run includes the 450-resident housing, 76-position food-capacity,
food-output, payroll, maintenance, pasture/road geometry, and operating-balance
audit. It also proves complete, unique inspection coverage, tap-versus-drag
behavior, live inventory refresh, and the pasture detail panel. Supplying an
exported save as the first argument additionally prints a
`LIVE_SAVE_AUDIT` report for that exact colony.

The additional expedition suite covers input guards, militia reservation and
payroll, all six movement stages, pause/speed, 1,000 deterministic yield samples,
save/resume at every stage, exactly-once rewards, timestep equivalence, storage
backlogs, butcher requirements, older/partial saves, reset, and rally geometry.
Browser checks use isolated test saves on desktop and touch-mobile viewports:

```sh
python -m pip install playwright==1.57.0
python -m playwright install --with-deps chromium
python verification/browser-hunts.py
python verification/browser-clarity.py --isolated
```

To verify a Pages release, pass its URL with `--url`; the browser verifier first
requires the served HTML to match the checkout byte-for-byte. Test fixtures are
created only inside the isolated browser contexts and never affect real saves.

GitHub `main` is canonical. The existing Google Drive ZIP is updated in place
only after the GitHub Pages release has been verified. Existing browser and
transferred saves must remain compatible.

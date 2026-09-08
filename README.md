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

Wall garrisons now use the actual existing militia, town guards, and soldiers.
Completed towers support two defenders each, with visible approaches and climbing.
The **Defesa das muralhas** panel authorizes a third wall tier after both stone
rings are finished. Each external side costs 2,000 gold and 60 stone; each inner
side costs 1,500 gold and 40 stone. The guild respects existing essential work,
material, cash-reserve, and sustainable-maintenance checks. Each upgraded side
adds 0.25 gold of upkeep per cycle, a visibly thicker walkable parapet, stairs,
and four positions. Eight towers plus eight upgraded sides provide 48 slots,
but only the existing 30 possible troops can occupy them: no free extra soldiers.

Bow-equipped defenders fire visible arrows from ready towers or wall positions.
Quivers consume real arrows, retain remaining ammunition across saves, and refill
from the existing ammunition depot only when stock exists. The panel can re-equip
an existing troop with a bow and 20 arrows while returning the previous weapon to
its capped arsenal. Sentries without bows occupy positions but do not shoot.
**Recolher guarnição** sends defenders down the stairs and back home. Militia
selected for a hunt first leave their posts; the hunting party waits for them,
so a person is never deployed in both places. Pause and all speed settings apply.

The optional **Exercício de defesa** demonstrates targeting, range, obstruction,
projectile travel, ammunition use, and simulated fortification protection against
six moving targets. It consumes real arrows but gives no reward and causes no
civilian losses or permanent damage. This release does not introduce automatic
raids. Its firing system is exercised through this explicit control rather than
silently enabling destructive attacks. Save format, colony capacity, and the
previous staffing/drawing optimization remain compatible.

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
node verification/walls-test.js
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

Wall-specific acceptance: `node verification/walls-test.js` and
`python verification/browser-walls.py` (or `--url` for exact served release bytes).
The wall suite checks paid construction, 48 unique slots/30 real troops, climbing,
gate-safe routes, recall/hunting handoff, ammunition and weapon conservation,
read-only drawing, pause, deterministic stepping, malformed saves and mid-flight
reloads. `verification/performance-walls.py --baseline PATH` records a controlled
host comparison; it is not a physical-phone benchmark.

## Citizen economy and taxes — stage 1

Open **Moradores e impostos** for named residents, individual wallets, ages,
gender, jobs, houses, wage claims, purchases and recent transaction records.
Existing wages now transfer town money to real people. Military staff count
inside the adult census, so 450 adults with 30 troops leave 420 civilian slots.

Food costs 0.20 gold/nutritional unit before 9% town + 1% player tax (0.22 total).
Available food remains free in kind for people without funds; healthcare, tools,
weapons and armor stay free. Personal goods consume actual stock. Leisure services
pay another resident, with the seller's income separate from both taxes.
Occupied houses have a fixed 0.10 gold/cycle assessment (0.09 town / 0.01 player),
with exemptions protecting food. These base prices and assessment are initial
balance choices. Old external revenues are labelled separately, not double-taxed.

New wallets start at zero; no retroactive cash is invented. Money uses integer
micro-gold and saved sub-cent clearing. Census, accounts, inheritance, taxes and
mid-cycle progress persist. The register is paginated and bounded; JSON export
contains balances, totals and recent entries, not unlimited transaction history.
The map/population limits are unchanged. Reload normally without clearing saves.

See `docs/releases/citizen-economy-stage-1.md` for accounting boundaries, tests,
prices, poverty protections and the remaining household/business/property stages.
The economy is now transactional at resident level but is not a closed market
or a full enterprise simulation. Wealth-sensitive family growth remains future work.

```sh
node verification/economy-test.js
node verification/economy-soak-test.js
python verification/browser-economy.py
```

### Settlers' daily visibility

The established colony now draws identity-linked people instead of anonymous dots
piled on doorways. Outdoor workers remain visible at their workplaces, indoor
workers alternate interior work and exterior tasks, and reserve residents and
children have staggered neighborhood routines. Each ordinary 56-second simulation
cycle contains at most 14 seconds inside. These are bounded local presentation
routines, not new wages, paid jobs or extra hauling. Real off-map hunts remain
absent; camera zoom and panning still determine which part of the world is visible.

Select a resident in **Moradores e impostos**, then **Localizar no mapa** to center
and highlight the actual person or their doorway. The register reports interior,
outdoor, military and off-map states. Cargo transport still uses the dedicated
wagons, with one visible driver rather than a duplicated civilian. Save/reload
preserves the visual clock and existing wallets, taxes, production and staffing.

Daily-life acceptance: `node verification/daily-life-test.js`,
`node verification/daily-life-equivalence-test.js`, and
`python verification/browser-daily-life.py`. The separate
`daily-life-live-soak.py` observes more than a minute of foreground 1x play.

## Expanded map and stronghold layout

The world now has 25% more total area (17,500 x 9,000), without increasing the
450-resident limit or resizing individual buildings. The inner enclosure protects
garrison, arms and valuable stockpiles; outer housing/services and external
production/ports have separate corridors and twelve vacant future-building plots.
Use **Planta da cidade** to visit sectors or fit the whole map.

Existing saves relocate through a one-time geometry revision, preserving paid
construction, inventories and financial accounts. Roads, gates, garrison approaches
and separate potable/wastewater routes were rebuilt together. Manual placement and
purposeful economic visits remain future work; see
`docs/releases/map-expansion-bastion.md` for precise scope and verification.

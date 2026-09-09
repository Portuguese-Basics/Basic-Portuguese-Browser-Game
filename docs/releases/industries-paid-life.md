# Funded industries, local employment and paid destinations — stage 2

Base release: `2c2069da81651b667c9e907ef07cdbd855c635d2`.
This is an opt-in expansion of the existing citizen economy on the 17,500 × 9,000 map.
The existing housing/population limits and 9% town / 1% player sales tax remain.

## Starting and construction

Open **Empresas e lazer**, then **Autorizar economia e obras**. The ten projects
are built one at a time by real available residents. Financing requires a positive
core operating balance, no hunger or military wage arrears, and enough cash to
retain the greater of the dynamic treasury reserve and four essential-expense
cycles. Forty wood and twenty stone stay protected after a construction purchase.
Original essential occupations and existing colony construction remain prior claims.
**Pausar novas obras** stops authorizing the next project, not wages already reserved.

| Establishment | Capital transferred | Wood | Stone | Paid construction shifts | Maximum role slots |
|---|---:|---:|---:|---:|---:|
| Casa de ofícios e zeladoria | 240 | 10 | 4 | 12 | 120 |
| Bosque de manejo e madeira | 220 | 8 | 2 | 12 | 8 |
| Pedreira cooperativa | 180 | 6 | 0 | 8 | 6 |
| Oficina de artigos | 280 | 14 | 6 | 16 | 12 |
| Horta de lúpulo e cevada | 180 | 12 | 2 | 12 | 6 |
| Cervejaria | 320 | 20 | 12 | 20 | 8 |
| Taverna do bairro | 240 | 12 | 6 | 12 | 3 |
| Teatro da cidade | 360 | 24 | 16 | 24 | 6 |
| Praça de festivais | 200 | 10 | 6 | 12 | 6 |
| Taverna do sul | 240 | 12 | 6 | 12 | 3 |
| **Total** | **2,460** | **128** | **60** | **140** | **178** |

Capital is a transfer from treasury to an individually recorded cooperative cash
account, not money destroyed or created. Construction wages are paid from that
account. Material costs consume existing stocks. Buildings are not usable before
paid construction finishes. These municipally capitalized cooperatives are **not
yet privately owned firms or tradeable investments**. Excess business cash above
working reserves returns to the treasury as identified dividends.

Role slots are upper bounds, not 178 perpetual salaries. Actual contracts depend
on paid demand, inventory, cash and the available labor reserve. Core employees,
military personnel and existing wagon drivers cannot simultaneously take a second
new job. New freight contracts have an additional eight-carrier concurrency cap.

## Income without an unfunded extra payroll

A normal cooperative or construction shift pays **0.80 gold after 48 simulated
seconds of completed work**. Up to three consecutive funded shifts are possible
before a break. An upkeep task pays **0.60 after 24 seconds on site**; a freight
contract pays **0.60 after delivery**. Travel does not manufacture wages. Cash is
reserved before assignment; cancellation returns remaining escrow and real cargo.

Once the upkeep house is built, **75% of maintenance the town was already paying**
is redirected to local upkeep contracts. The original maintenance debit is not
charged twice. The other 25% remains an explicitly external maintenance cost.
Residents who have gone longest without local income are preferred, with wallet
balance as a tie-breaker. Tasks visit actual existing frontages and wells. Unspent
contract funds above a working reserve return to the treasury.

This produces rotating paid opportunities rather than claiming to employ every
adult permanently. The panel distinguishes contracts in progress from adults with
a regular wage or a local payment in the last ten simulated minutes. Poor or
undersupplied colonies can still have unmet demand, fewer jobs or cancelled work;
there is no money creation, compulsory consumption or unlimited business bailout.

## Supply chains and storage

Production requires completed paid labor credits, finite inventory space and inputs.

- Managed woodland: two labor credits and one standing tree produce four wood.
  Twenty-four trees are managed; cut trees have a 600-second replanting wait.
- The new quarry consumes a **finite 900-unit rock deposit**, producing three stone
  per labor credit. It can eventually exhaust; further deposits are future work.
- Mixed hops/barley field: one credit produces two hops and four grain. Stocks are
  capped at 96 hops and 192 grain. This does not divert the town's food farms.
- Brewery: two credits + two hops + four grain + one wood produce eight beer.
  Brewing requires the existing cistern and at least one public well to be built.
  Beer storage is capped at 120. This is not a new hydraulic-volume model.
- Artisans: one credit + one wood produce two personal articles, capped at 96.
- Theater/festival labor prepares at most 48 service places per cycle. This capacity
  refreshes rather than becoming an unlimited inventory of tickets; service still
  needs an actual worker present.

Named contracted carriers physically collect and deliver reserved cargo through
existing roads and gates. Supplier principal, town tax, player tax and driver pay
settle after delivery. Full destinations wait; cancelled reserved cargo is returned
or held in a saved return backlog. The original wagon/production economy remains
intact; the new arrival-gated freight model applies to the new business invoices,
not retroactively to all old resource transfers.

Supply prices include hops 0.35, grain 0.12, wood 0.65 and beer wholesale 0.65 gold
per unit **before** 9% + 1% taxes. While the ten buildings are unfinished, the city
may buy real delivered cooperative wood/stone above its reserve; it does not keep
buying construction stock forever to create artificial demand.

New external buyers place bounded orders of articles or beer: **24 units combined
per simulated minute**, capped additionally by actual stocks, carriers and delivery.
These are explicitly modelled external money sources. Old export/outpost receipts
keep their prior labelled 90/10 bridge; they are not taxed again as new domestic sales.
Every separate wholesale or retail sale has its own principal and 9%/1% taxes;
this is a transaction tax, not VAT with an input-credit system.

## Visits, venues and daily life

| Delivered purchase | Seller principal | Town 9% | Player 1% | Total |
|---|---:|---:|---:|---:|
| Beer serving | 1.40 | 0.126 | 0.014 | **1.54** |
| Theater visit | 0.60 | 0.054 | 0.006 | **0.66** |
| Festival admission | 0.80 | 0.072 | 0.008 | **0.88** |
| Personal article | 1.60 | 0.144 | 0.016 | **1.76** |

Prices are game-design choices, not historical or real-market claims. Initial
lower beer/festival prices were revised after the solvency audit showed continued
venue cash depletion despite a green municipal budget. Both attempts are retained
in the private development evidence.

Customers travel to a named destination, enter its visible activity area, and pay
only after arrival and ten seconds of service. A provider, inventory/capacity,
opening status, and the customer's protected food/dependent reserve must still
be available at settlement. Beer is adult-only. A missed or cancelled service is
not taxed. Cash, actors, orders and delivery state survive reload without repeating
charges. Bounded queues and the existing optional-spending toggle limit demand.

A festival starts **after** paid organizers arrive and prepare. It stays open for
180 seconds, with at least 600 seconds between openings. It spends its own cash;
the old automatic 600-gold treasury festival trigger is disabled while this system
is active. There is no civilian damage or free festival resource reward.

Three free gardens/rest/reading spaces provide destinations for residents without
money. Free pauses and public activity do not generate sales. Workers in the new
businesses have visible stations; existing staffed indoor workplaces get cutaway
working areas. Work and seating circuits begin/end at the actual entrance. Existing
core production is still high-level, rather than every legacy job becoming
arrival-gated. Military, wall garrisons, actual off-map hunts and old wagon crews
keep their real positions; no additional decorative inhabitants are created.

**Moradores e impostos → person → Localizar no mapa** follows the identity's
current activity. Selecting a company in the new panel centers that establishment.
The existing register refreshes at 1 Hz while open instead of four times per second;
the simulation is not throttled. Current unequal portrait-map projection is unchanged.

## Verification and boundaries

Required tests include the original twelve simulation/renderer scripts, 23 new
industry groups, active staged construction and income replay, and independent
geometry covering ten buildings, three public spaces and 3,263 routes. The new
browser suite covers desktop/touch navigation, actual capital debit, arrival-gated
spending, a mid-trip reload, all account fields and exactly-once payment. Existing
feature/raster checks remain required. Record exact tested runtime hashes and
published-byte verification before claiming deployment.

Use `INDUSTRY_SOAK_CYCLES=180 node verification/industry-soak-test.js` for the
full staged synthetic economy and nine reloads. Benchmark with
`python verification/performance-industry.py --baseline /path/to/previous/index.html
--save verification-output/industry-soak-save.json`. This benchmark is host Chromium
with a mobile viewport and in-memory saves, **not physical phone/Safari/thermal or
battery certification**. Actual budgets, recent income, all adverse runs and venue
cash trends belong in the release evidence; a positive town budget alone is not
proof of long-term profitability for every firm.

Manual building placement (#8), private business ownership, property, household
policy, banking and complete replacement of the old cash-flow bridge (#5) remain
future work. Food assistance, free healthcare/tools/arms and save recovery are not
removed to hide poverty or finance the expansion.

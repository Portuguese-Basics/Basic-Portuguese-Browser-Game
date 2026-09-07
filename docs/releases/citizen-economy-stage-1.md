# Citizen economy and taxation — stage 1

Baseline: `a47830faae4c4c17e680dead01932e9014dbdf14` (manned walls).

## What this release changes

The colony now registers each adult and child as a named person with a persistent
ID, gender, the existing simulated age, a household address, job/slot, salary,
wallet, wage claims, purchases, taxes, service income, and a short personal ledger.
Names and wallets persist through reloads. Children keep their ID and funds when
they become adults. Inheritance transfers existing cash and unpaid wage claims to
a family member; unclaimed funds and claims are held separately in custody.
The initial migration creates zero-balance wallets, not invented retroactive pay.

**Moradores e impostos** opens the searchable, paginated register. Select a name
for the individual account. **Pausar compras opcionais** suspends only discretionary
purchases. **Quitar salários atrasados com excedente** uses actual town cash above its reserve.
**Exportar cadastro e livro** downloads the balances, cumulative totals and recent
transactions. This is not an unlimited historical transaction database.

## Funded payroll and real people

Existing wage deductions now credit actual people. Ordinary civilian workers earn
1 gold/cycle; public-service roles, including migration clerks, earn 2. The existing
militia/guard/soldier rates remain 1/2/4. No wage or inheritance sales tax is imposed.
Available cash is apportioned if payroll is underfunded; unpaid amounts are claims,
not spendable money. Their later payment cannot create cash or erase the town reserve.

Military staff are now reserved from the adult census rather than also being counted
as civilian workers. A 450-adult colony with 30 troops has 420 civilian job/reserve
slots, not 450 civilian workers plus 30 extra people. The underlying production
allocator otherwise retains its decisions and exact-input cache. The register
retains people in existing jobs where capacity permits. A person cannot draw both
a civilian salary and a military salary. General labor reserves have no automatic
wage merely for existing. Wealth does not yet control births or hiring decisions.

## Prices and protections

The brief requires affordable food and 9% town plus 1% player sales taxes. The
following base prices and fixed house assessment are design choices for this stage,
not rates previously specified by the user.

| Purchase | Price before tax | Town sales tax | Player sales tax | Total |
|---|---:|---:|---:|---:|
| One nutritional unit | 0.200 | 0.018 | 0.002 | 0.220 gold |
| One personal article from actual goods stock | 2.000 | 0.180 | 0.020 | 2.200 gold |
| One leisure service supplied by another resident | 0.500 | 0.045 | 0.005 | 0.550 gold |

An adult needs one nutritional unit per cycle; existing child/baby consumption
weights remain unchanged. Food is physically consumed only once by the existing
supply system. The financial layer bills only the delivered nutritional quantity.
Related adults can make untaxed family-support transfers. Residents without money
receive available food in kind with no fictitious taxable sale, debt or cash grant.
Actual food shortages remain visible; a wallet cannot create missing food.
Healthcare, tools, weapons and armor remain free at the point of provision.

Discretionary purchases require a built market and existing supply. Personal goods
consume real goods inventory and are bounded by market staffing. Leisure services
pay actual adults in the unpaid labor reserve; the provider receives the base price,
not the town. No second salaried job is created. Providers rotate and each selected
provider supplies at most one service in the normal cycle. Buyers retain a buffer
for three food cycles and dependents before optional spending, and wait at least
five cycles between optional purchases. Unpaid wage claims do not count as cash.

A small **0.10 gold per occupied physical house per cycle** assessment is divided
as **0.09 to the town and 0.01 to the player**. The brief did not define the property
valuation base, so this is a fixed occupancy assessment, not 9% of a house's market
value or a tax on all personal wealth. Empty houses are not charged. Children do
not fund the levy. Poor households and physically food-short colonies are exempt;
no eviction or property-tax debt is created. Household ownership/valuation and
property buying/selling remain future work.

## Money flow and accounting boundaries

For municipal food and goods, the town receives the seller's principal plus its
9% tax; the player receives the 1% tax. These are separately reported. For private
services, the resident provider receives the principal, the town the 9%, and the
player the 1%. The buyer pays 110% of the base price, not a 90/10 division of a sale.

All new monetary amounts use integer micro-gold (1 gold = 1,000,000 units).
Existing public balances remain cent-gold, so sub-cent tax amounts are held in
saved clearing accounts until enough accumulates for a cent. No rounding remainder
is thrown away. Individual wallets, town/player balances, clearing accounts and
unclaimed estates are reconciled against opening cash and net external flows.
Wage claims are tracked separately from spendable money.

This is **not yet a closed market economy**. The existing outpost receipts, legacy
90/10 surplus-export proceeds, construction charges and maintenance retain their
old behavior. A labelled legacy bridge records their public cash changes as external
flows. It is not a detailed supplier ledger and does not re-tax these old flows.
Municipal production, resource transport and equipment issuance are not yet sales
between separately capitalized enterprises. There are no bank loans, interest-bearing
citizen accounts, market-clearing prices or business ownership in this stage.

## Bounded runtime and save behavior

Population/map limits remain unchanged. New data resides inside the existing
colony save. Up to 512 recent global entries, 8 entries per resident and 100 recent
estate records are retained, plus persistent balances and cumulative totals. The
register renders 20 people/page, refreshes at most four times a real second when
open, and performs no DOM refresh while closed. The normal renderer remains
read-only. Financial changes do not invalidate production staffing on every coin;
only the feature's active flag is added to that allocator's dependency signature.

Use an ordinary reload; do not clear player storage. A mid-cycle reload must not
repeat a wage, meal purchase or tax. No real-world personal information or analytics
is collected: citizen names are generated fictional game identities.

## Verification and interpretation

The economic suite covers identity, military reservation, funded/partial payroll,
real private-service proceeds, exact tax splits, clearing remainders, food assistance,
physical shortage, house exemptions, maturity, estates, arrears, imports, read-only
drawing and bounded state. An accelerated 180-cycle API replay checks conservation,
450 residents and six reload checkpoints. This replay is not a physical three-hour
session or a browser frame-rate benchmark.

The existing full-capacity food, hunting, wall and cached-versus-uncached staffing
suites continue to run. Old-runtime equality tests explicitly disable the new economy
in their isolated comparison: they protect the legacy fallback, **not** a claim that
active economic behavior is identical to the older game. Active transfer and workforce
changes are intentional and tested separately. Test-only fallback does not disable
the feature in production.

Run from the repository root:

```sh
node verification/smoke-test.js
node verification/militia-hunts-test.js
node verification/clarity-test.js
node verification/walls-test.js
node verification/economy-test.js
node verification/economy-soak-test.js
node verification/baseline-equivalence-test.js
PREVIOUS_RUNTIME_REF=a47830faae4c4c17e680dead01932e9014dbdf14 node verification/baseline-equivalence-test.js
python verification/browser-economy.py
python verification/performance-economy.py --baseline /path/to/manned-walls-index.html --seconds 20
```

Browser tests require Playwright/Chromium. `--url` verifies exact served bytes;
`--isolated` uses disposable in-memory storage and is not live-origin verification.
Host Chromium and a mobile viewport do not certify physical Safari/Android,
thermal behavior, battery life or device-specific storage performance.

## Remaining economic stages

1. **Households and demographic choices:** persist explicit family relationships,
   household budgets, voluntary savings goals and wealth-sensitive family growth,
   without making poverty or gender an arbitrary exclusion from food/healthcare.
2. **Businesses and productive purchases:** named enterprises, startup capital,
   inventory ownership, invoices, wages paid by employers, goods/services variety,
   demand and stock-based pricing. Distinguish imports from local transfers and
   remove the generic bridge one transaction family at a time.
3. **Property and municipal policy:** actual ownership/valuation, a deliberate tax
   base, transparent subsidies, configurable rates, and sustainable public budgets.
   Preserve the agreed 9%/1% sales split unless the user changes it.
4. **Savings and distribution:** banking, pensions and investment only after cash,
   liabilities, defaults and money creation have explicit invariants. Add poverty,
   wealth distribution and household-consumption reporting before strong feedbacks.

The highest-priority next issue is genuine income opportunities for reserves, not
removing food protection. Giving names and wallets to currently idle people does
not itself create salaried work or enough paid demand to employ them all.

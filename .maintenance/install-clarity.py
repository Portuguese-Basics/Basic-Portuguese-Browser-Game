"""One-time exact installer, restricted to the tested release files."""
from pathlib import Path
import hashlib
import subprocess

EXPECTED_BASE = 'a30767c7518f07ded2dcae69aec18df0f083aa65caab5e51a457d12d856361ed'
EXPECTED_RELEASE = 'd4f9e671b33ee4a453525cd4798a122bf89fa3ef9489eae2463f1608514e6599'
def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()
assert sha('index.html') == EXPECTED_BASE, 'Unexpected runtime base; do not overwrite another release'
subprocess.run(['git', 'apply', '--check', '.maintenance/clarity.patch'], check=True)
subprocess.run(['git', 'apply', '.maintenance/clarity.patch'], check=True)
assert sha('index.html') == EXPECTED_RELEASE

def replace_once(path, old, new):
    p = Path(path)
    s = p.read_text()
    assert s.count(old) == 1, f'Unexpected source anchor in {path}'
    p.write_text(s.replace(old, new, 1))

replace_once('verification/smoke-test.js', '    translate() {},\n', '    translate() {},\n    scale() {},\n')
replace_once('README.md', 'Food staffing is based on measured end-to-end output rather than nominal field\n', '''Fields now distinguish grains, vegetables, beans and pasture with bounded,
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
''')
replace_once('README.md', 'node verification/militia-hunts-test.js\n', 'node verification/militia-hunts-test.js\nnode verification/clarity-test.js\n')
replace_once('README.md', 'python verification/browser-hunts.py\n', 'python verification/browser-hunts.py\npython verification/browser-clarity.py --isolated\n')
replace_once('.github/workflows/regression.yml', 'branches: [main, feature/militia-hunting-expeditions]', "branches: [main, 'feature/**']")
replace_once('.github/workflows/regression.yml', '          node verification/militia-hunts-test.js | tee verification-output/militia-hunts-test.log\n', '          node verification/militia-hunts-test.js | tee verification-output/militia-hunts-test.log\n          node verification/clarity-test.js | tee verification-output/clarity-test.log\n')
replace_once('.github/workflows/regression.yml', '        run: python verification/browser-hunts.py | tee verification-output/browser-console.log\n', '''        run: |
          python verification/browser-hunts.py | tee verification-output/browser-console.log
          python -m http.server 8765 --bind 127.0.0.1 > /tmp/clarity-server.log 2>&1 &
          server_pid=$!
          trap 'kill "$server_pid"' EXIT
          sleep 1
          python verification/browser-clarity.py --url http://127.0.0.1:8765/ | tee verification-output/clarity-browser.log
''')
replace_once('.github/workflows/verify-pages.yml', '          python verification/browser-hunts.py --url "https://portuguese-basics.github.io/Basic-Portuguese-Browser-Game/?release=$RELEASE_SHA" | tee verification-output/browser-console.log\n', '          python verification/browser-hunts.py --url "https://portuguese-basics.github.io/Basic-Portuguese-Browser-Game/?release=$RELEASE_SHA" | tee verification-output/browser-console.log\n          python verification/browser-clarity.py --url "https://portuguese-basics.github.io/Basic-Portuguese-Browser-Game/?release=$RELEASE_SHA" | tee verification-output/clarity-browser.log\n')
for path in ['index.html', 'README.md', 'verification/smoke-test.js', '.github/workflows/regression.yml', '.github/workflows/verify-pages.yml']:
    print(sha(path), path)

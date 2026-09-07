"""One-use exact patch transfer; removed before release.
The readable patch is retained in verification evidence. No credentials or
network calls are present in the payload, and workflow files are not changed.
"""
from pathlib import Path
import base64
import hashlib
import subprocess
import zlib

BASE = 'bc5a61a8ee016a27a369486343ab8fae079224283c3401a43713122cfc6755f0'
PATCH_SHA = '34e785b1aee3f9f0e7a629079eb71d6f9955ecfdb6f8f4e43f3522db8a6c9b8c'
EXPECTED = {
 'index.html': 'b33b52d820e2d1b7f07bc9907270e8e0651c3fd712bf6a79400a5e79a171a761',
 'README.md': '5e775659f0ae640a2fa5164327ab35edc1a17f04341793b2f478f995a436ee6b',
 'verification/baseline-equivalence-test.js': '41f4edf33016354a096a691cca33cb52ef92a409c2869a3f01d049162d75692d',
 'verification/walls-test.js': '44abe9493a2f730d4943867cc50e6eca8ca52d3ee35f5c23aeb2927d9aff70ea',
 'verification/browser-walls.py': '6d0e1b3915b743fafbff0d9e06d8ff16f8b5d85da659ef28e81f7a948a7759bd',
 'verification/performance-walls.py': '2daf259122cbf1ca27c4934e1dc5b1914acec71d066fdd98e046c1c89f2ac4dd',
 'docs/releases/manned-walls.md': 'aa59ae6ba6a5494b6a7dc0a8334b0ca57990d8953617e6d1165de3cfdd1c258f',
}
assert hashlib.sha256(Path('index.html').read_bytes()).hexdigest() == BASE, 'Unexpected base runtime'
payload = ''.join(Path(f'.maintenance/manned-walls.{i:02}.b64').read_text().strip() for i in range(1, 5))
patch = zlib.decompress(base64.b64decode(payload, validate=True))
assert hashlib.sha256(patch).hexdigest() == PATCH_SHA, 'Patch transfer mismatch'
subprocess.run(['git', 'apply', '--check', '-'], input=patch, check=True)
subprocess.run(['git', 'apply', '-'], input=patch, check=True)
for name, digest in EXPECTED.items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == digest, f'Output mismatch: {name}'
    print(digest, name)
Path('verification-output/transferred.patch').write_bytes(patch)

"""Generate VAPID keys for Web Push using OpenSSL.

Run once locally. Outputs:
  - VAPID_PUBLIC_KEY  -> paste into index.html (it's public, embedded in frontend)
  - VAPID_PRIVATE_KEY -> add to GitHub Secrets (sensitive, never commit)
"""
import subprocess, base64, re, os, tempfile, sys

def b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b'=').decode()

def extract(text: str, label: str) -> bytes:
    m = re.search(rf'{label}:\s*\n((?:\s+[0-9a-f:]+\n)+)', text)
    if not m:
        raise SystemExit(f'Could not parse {label} from openssl output')
    return bytes.fromhex(re.sub(r'[^0-9a-f]', '', m.group(1)))

with tempfile.NamedTemporaryFile(suffix='.pem', delete=False) as f:
    pem = f.name

try:
    subprocess.run(
        ['openssl', 'ecparam', '-genkey', '-name', 'prime256v1', '-noout', '-out', pem],
        check=True, stderr=subprocess.DEVNULL,
    )
    out = subprocess.run(
        ['openssl', 'ec', '-in', pem, '-text', '-noout'],
        capture_output=True, text=True, check=True,
    ).stdout

    priv = extract(out, 'priv')
    # ASN.1 INTEGER may have leading 0x00; trim or pad to exactly 32 bytes
    priv = priv[-32:] if len(priv) > 32 else priv.rjust(32, b'\x00')

    pub = extract(out, 'pub')
    if len(pub) != 65 or pub[0] != 0x04:
        raise SystemExit(f'Unexpected pub key format ({len(pub)} bytes)')

    print('VAPID_PUBLIC_KEY=' + b64url(pub))
    print('VAPID_PRIVATE_KEY=' + b64url(priv))
finally:
    os.unlink(pem)

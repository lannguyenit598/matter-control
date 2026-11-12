import json
from pathlib import Path
import urllib.error
import urllib.request

root = Path(__file__).parent
manifest = json.loads((root / "apps/frontend/.next/server/server-reference-manifest.json").read_text())
action = next(key for key, value in manifest["node"].items() if value.get("exportedName") == "uploadEmlAction")
boundary = "SyntheticReviewBoundary"
url = "http://127.0.0.1:3117/matters/01900000-0000-7000-8000-000000000001/documents"
results = []
for size in (128, 2 * 1024 * 1024):
    eml = b"From: synthetic@example.invalid\r\nSubject: Synthetic size probe\r\n\r\n" + b"x" * size
    args = json.dumps(["01900000-0000-7000-8000-000000000001", "$K1", "01900000-0000-7000-8000-000000000002"])
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="0"\r\n\r\n{args}\r\n'
        f'--{boundary}\r\nContent-Disposition: form-data; name="1_file"; filename="synthetic.eml"\r\nContent-Type: message/rfc822\r\n\r\n'
    ).encode() + eml + f"\r\n--{boundary}--\r\n".encode()
    request = urllib.request.Request(url, data=body, method="POST", headers={
        "Origin": "http://127.0.0.1:3117", "Next-Action": action,
        "Content-Type": f"multipart/form-data; boundary={boundary}", "Accept": "text/x-component",
    })
    try:
        response = urllib.request.urlopen(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        text = response.read().decode(errors="replace")
        results.append({"file_bytes": len(eml), "request_bytes": len(body), "status": response.status, "body_excerpt": text[:900]})
(root / "upload-http-probe.json").write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
assert results[0]["status"] == 200, results
assert results[1]["status"] != 200, results

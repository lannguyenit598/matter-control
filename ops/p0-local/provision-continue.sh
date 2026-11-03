#!/usr/bin/env bash
# One-shot continuation for the interrupted first provisioning run: completes the
# API app (private_key_jwt), JSON key, synthetic test users and the receipt for the
# already-created org/project/oidc-web-app. Idempotence guard: refuses if receipt exists.
set -euo pipefail
export LC_ALL=C
cd "$(dirname "$0")"
umask 077

[ -e runtime/provisioning.json ] && { echo "REFUSING: already provisioned" >&2; exit 2; }

BASE="http://localhost:8080"
HDR_JSON='Content-Type: application/json'
ORG="396855005765697539"
PROJ="396855005832806403"
WEB_CLIENT="396855005899980803"

PAT=$(cat secrets/provisioner-pat.txt)
S=$(curl -fsS -X POST "$BASE/v2/sessions" -H "$HDR_JSON" -H "Authorization: Bearer $PAT" \
  -d "{\"checks\":{\"user\":{\"loginName\":\"zitadel-admin@zitadel.localhost\"},\"password\":{\"password\":\"$(cat secrets/admin-password.txt)\"}}}" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["sessionToken"])')
AUTH="Authorization: Bearer $S"
ORGCTX="x-zitadel-orgid: $ORG"

echo "== remove basic-auth API app from the failed attempt =="
curl -sS -X DELETE "$BASE/management/v1/projects/$PROJ/apps/396855035494924291" -H "$AUTH" -H "$ORGCTX" | head -c 150; echo

echo "== API app (private_key_jwt) =="
APIAPP=$(curl -fsS -X POST "$BASE/management/v1/projects/$PROJ/apps/api" -H "$HDR_JSON" -H "$AUTH" -H "$ORGCTX" \
  -d '{"name":"mattercontrol-api","authMethodType":"API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT"}')
API_APP_ID=$(printf '%s' "$APIAPP" | python3 -c 'import json,sys;print(json.load(sys.stdin)["appId"])')
API_CLIENT=$(printf '%s' "$APIAPP" | python3 -c 'import json,sys;print(json.load(sys.stdin)["clientId"])')
SECRET_LEN=$(printf '%s' "$APIAPP" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(len(d.get("clientSecret") or ""))')
echo "API_APP_ID=$API_APP_ID API_CLIENT=$API_CLIENT clientSecret_len=$SECRET_LEN (must be 0)"
[ "$SECRET_LEN" = "0" ] || { echo "private_key_jwt not applied" >&2; exit 4; }

echo "== API app JSON key =="
KEY=$(curl -fsS -X POST "$BASE/management/v1/projects/$PROJ/apps/$API_APP_ID/keys" -H "$HDR_JSON" -H "$AUTH" -H "$ORGCTX" \
  -d '{"type":"KEY_TYPE_JSON","expirationDate":"2099-01-01T00:00:00Z"}')
printf '%s' "$KEY" | python3 -c 'import json,sys,base64;print(base64.b64decode(json.load(sys.stdin)["keyDetails"]).decode())' > runtime/mc-api-app-key.json
chmod 600 runtime/mc-api-app-key.json

echo "== synthetic test users =="
P1="Aa1!$(openssl rand -hex 10)"
P2="Bb2!$(openssl rand -hex 10)"
U1=$(curl -fsS -X POST "$BASE/v2/users/human" -H "$HDR_JSON" -H "$AUTH" -H "$ORGCTX" -d '{
  "username":"mc-alice","organization":{"orgId":"'$ORG'"},
  "profile":{"givenName":"Alice","familyName":"Synthetic"},
  "email":{"email":"alice@mattercontrol.local","isVerified":true},
  "password":{"password":"'$P1'","changeRequired":false}}')
U1_ID=$(printf '%s' "$U1" | python3 -c 'import json,sys;print(json.load(sys.stdin)["userId"])')
U2=$(curl -fsS -X POST "$BASE/v2/users/human" -H "$HDR_JSON" -H "$AUTH" -H "$ORGCTX" -d '{
  "username":"mc-bob","organization":{"orgId":"'$ORG'"},
  "profile":{"givenName":"Bob","familyName":"Synthetic"},
  "email":{"email":"bob@mattercontrol.local","isVerified":true},
  "password":{"password":"'$P2'","changeRequired":false}}')
U2_ID=$(printf '%s' "$U2" | python3 -c 'import json,sys;print(json.load(sys.stdin)["userId"])')
echo "USERS=$U1_ID,$U2_ID"

printf '%s' "{\"alice\":{\"userId\":\"$U1_ID\",\"username\":\"mc-alice\",\"password\":\"$P1\"},\"bob\":{\"userId\":\"$U2_ID\",\"username\":\"mc-bob\",\"password\":\"$P2\"}}" > secrets/test-users.json
chmod 600 secrets/test-users.json

python3 - <<EOF
import json
out={"task":"MC-P0-ZCODE-EXECUTION","provider":"ZITADEL v4.16.0 local (docker compose, loopback-only)","issuer":"http://localhost:8080","issuer_pinned":True,"organization":{"name":"MatterControl Local","id":"$ORG"},"project":{"name":"mattercontrol","id":"$PROJ"},"oidc_web_app":{"name":"mattercontrol-web","clientId":"$WEB_CLIENT","flow":"authorization_code+PKCE_S256","redirectUris":["http://localhost:3000/api/auth/callback","http://localhost:3000/api/auth/callback/dev"],"postLogoutRedirectUris":["http://localhost:3000/","http://localhost:3000/logged-out"]},"api_app":{"name":"mattercontrol-api","id":"$API_APP_ID","clientId":"$API_CLIENT","authMethod":"private_key_jwt","keyFile":"runtime/mc-api-app-key.json"},"audience_note":"API app clientId is the pinned MatterControl API audience for access-token checks.","test_users":[{"username":"mc-alice","id":"$U1_ID","passwordRef":"secrets/test-users.json#alice"},{"username":"mc-bob","id":"$U2_ID","passwordRef":"secrets/test-users.json#bob"}],"provisioning_route":"login-client PAT (bootstrap) -> admin human session (Session API v2 password check) -> Management API v1 REST; no admin-session or PAT values persisted","provisioned_utc":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
json.dump(out,open("runtime/provisioning.json","w"),indent=2)
EOF
chmod 644 runtime/provisioning.json
echo PROVISIONING_COMPLETE

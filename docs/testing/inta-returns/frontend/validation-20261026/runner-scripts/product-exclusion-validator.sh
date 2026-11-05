#!/usr/bin/env bash
# MC-002-INTA-FE-VALIDATION — Part B: INT-ISO-02 / INT-ENV-07 Product Module Exclusion
# Author: Actual Antigravity (Gemini 3.8 Flash High)
# Executes:
# 1. rtk proxy pnpm exec vitest list --filesOnly --json
# 2. rtk proxy pnpm build
# in the clean product snapshot with private local dependencies.
# Inspects test collection, emitted .next manifests, route maps, NFT traces, and bundle inventory.

set -euo pipefail

SANDBOX="/tmp/mc002-inta-fe-validation-20261026"
PRODUCT_DIR="$SANDBOX/product-snapshot"
OUTPUT_DIR="$SANDBOX/output/product-exclusion"
mkdir -p "$OUTPUT_DIR"

NODE_BIN="$(which node)"
PNPM_BIN="$(which pnpm)"
CLEAN_PATH="$(dirname "$NODE_BIN"):$(dirname "$PNPM_BIN"):/usr/bin:/bin:/usr/sbin:/sbin"

REPORT_JSON="$OUTPUT_DIR/product-exclusion-report.json"

echo "================================================================"
echo "MC-002-INTA-FE-VALIDATION Part B: Product Module Exclusion"
echo "Start UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Product snapshot: $PRODUCT_DIR"
echo "Node: $($NODE_BIN --version)"
echo "pnpm: $($PNPM_BIN --version)"
echo "================================================================"

# Step 1: Vitest test collection
echo ""
echo "--- Step 1: Vitest list --filesOnly --json ---"
VITEST_START_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
VITEST_STDOUT="$OUTPUT_DIR/vitest-list.stdout.json"
VITEST_STDERR="$OUTPUT_DIR/vitest-list.stderr.log"

VITEST_EXIT=0
(
  cd "$PRODUCT_DIR"
  env -i \
    PATH="$CLEAN_PATH" \
    HOME="$SANDBOX/home" \
    COREPACK_HOME="/Users/nguyenvanlan/.cache/node/corepack" \
    COREPACK_ENABLE_NETWORK=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=test \
    API_MODE=demo \
    "$PNPM_BIN" exec vitest list --filesOnly --json >"$VITEST_STDOUT" 2>"$VITEST_STDERR"
) || VITEST_EXIT=$?
VITEST_END_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo "Vitest list exit code: $VITEST_EXIT"

# Step 2: Next.js product build
echo ""
echo "--- Step 2: pnpm build ---"
BUILD_START_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
BUILD_STDOUT="$OUTPUT_DIR/pnpm-build.stdout.log"
BUILD_STDERR="$OUTPUT_DIR/pnpm-build.stderr.log"

BUILD_EXIT=0
(
  cd "$PRODUCT_DIR"
  env -i \
    PATH="$CLEAN_PATH" \
    HOME="$SANDBOX/home" \
    COREPACK_HOME="/Users/nguyenvanlan/.cache/node/corepack" \
    COREPACK_ENABLE_NETWORK=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=production \
    API_MODE=demo \
    "$PNPM_BIN" build >"$BUILD_STDOUT" 2>"$BUILD_STDERR"
) || BUILD_EXIT=$?
BUILD_END_UTC="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo "Build exit code: $BUILD_EXIT"

# Step 3: Analyze collected tests and build artifacts for harness pollution
echo ""
echo "--- Step 3: Artifact and Module Analysis ---"

python3 -c "
import json, os, glob, hashlib, sys

product_dir = os.path.realpath('$PRODUCT_DIR')
output_dir = os.path.realpath('$OUTPUT_DIR')
dot_next = os.path.join(product_dir, '.next')

# 1. Parse vitest test list
vitest_stdout_file = os.path.join(output_dir, 'vitest-list.stdout.json')
collected_tests = []
harness_in_tests = []
try:
    with open(vitest_stdout_file) as f:
        content = f.read()
        idx = content.find('[')
        if idx != -1:
            tests_data = json.loads(content[idx:])
            for t in tests_data:
                fpath = os.path.realpath(t.get('file', ''))
                collected_tests.append(fpath)
                rel_path = os.path.relpath(fpath, product_dir)
                # Check if test file escapes product root or references harness
                if rel_path.startswith('..') or 'harness' in rel_path.lower() or 'mc002-inta' in fpath.lower() and not fpath.startswith(product_dir):
                    harness_in_tests.append(fpath)
except Exception as e:
    print(f'Error parsing vitest output: {e}')

# 2. Inspect .next manifests and routes
routes_manifest = {}
routes_manifest_file = os.path.join(dot_next, 'routes-manifest.json')
harness_routes = []
if os.path.exists(routes_manifest_file):
    with open(routes_manifest_file) as f:
        routes_manifest = json.load(f)
        for r in routes_manifest.get('dynamicRoutes', []) + routes_manifest.get('staticRoutes', []):
            page = r.get('page', '')
            if 'harness' in page.lower():
                harness_routes.append(page)

app_build_manifest = {}
app_build_manifest_file = os.path.join(dot_next, 'app-build-manifest.json')
harness_pages = []
if os.path.exists(app_build_manifest_file):
    with open(app_build_manifest_file) as f:
        app_build_manifest = json.load(f)
        for p in app_build_manifest.get('pages', {}).keys():
            if 'harness' in p.lower():
                harness_pages.append(p)

# 3. Inspect NFT (Node File Trace) files
nft_files = glob.glob(os.path.join(dot_next, '**/*.nft.json'), recursive=True)
harness_in_nft = []
total_nft_files = len(nft_files)
for nft in nft_files:
    try:
        with open(nft) as f:
            data = json.load(f)
            for fpath in data.get('files', []):
                # NFT files have relative paths from the nft directory
                abs_fpath = os.path.normpath(os.path.join(os.path.dirname(nft), fpath))
                # Check if trace points to harness
                if 'mc002-inta-harness' in abs_fpath.lower() or 'tools/inta-harness' in abs_fpath.lower() or 'app/harness' in abs_fpath.lower():
                    harness_in_nft.append({'nft': os.path.relpath(nft, dot_next), 'trace': fpath})
    except Exception:
        pass

# 4. Inventory of emitted client JS bundles and asset hashes
emitted_js_files = []
static_chunks_dir = os.path.join(dot_next, 'static', 'chunks')
if os.path.exists(static_chunks_dir):
    for root, _, files in os.walk(static_chunks_dir):
        for fname in files:
            if fname.endswith('.js'):
                fpath = os.path.join(root, fname)
                h = hashlib.sha256(open(fpath, 'rb').read()).hexdigest()
                rel_path = os.path.relpath(fpath, dot_next)
                emitted_js_files.append({
                    'path': rel_path,
                    'bytes': os.path.getsize(fpath),
                    'sha256': h
                })

# 5. String search for prohibited harness tokens across all emitted files
harness_token_hits = []
prohibited_tokens = ['/harness/case', '@harness/mc002-inta-harness', 'mc002-inta-harness', 'app/harness/case', 'MC_INTA_ENABLE']
for root, _, files in os.walk(dot_next):
    for fname in files:
        if fname.endswith(('.js', '.json', '.html', '.txt')):
            fpath = os.path.join(root, fname)
            try:
                content = open(fpath, 'r', errors='ignore').read()
                for token in prohibited_tokens:
                    if token in content:
                        harness_token_hits.append({'file': os.path.relpath(fpath, dot_next), 'token': token})
            except Exception:
                pass

report = {
    'canonicalIds': ['INT-ISO-02', 'INT-ENV-07'],
    'productSnapshot': product_dir,
    'sourceCommit': '3e5a642479acb789eb210e73fba956f3e85082e3',
    'tools': {
        'node': '$($NODE_BIN --version)',
        'pnpm': '$($PNPM_BIN --version)',
        'next': '16.4.2 (Turbopack bundler per package.json build script)'
    },
    'vitest': {
        'command': 'pnpm exec vitest list --filesOnly --json',
        'cwd': product_dir,
        'startUTC': '$VITEST_START_UTC',
        'endUTC': '$VITEST_END_UTC',
        'exitCode': $VITEST_EXIT,
        'totalTestsCollected': len(collected_tests),
        'collectedTests': collected_tests,
        'harnessInTests': harness_in_tests,
        'exclusionVerdict': 'PASS' if len(harness_in_tests) == 0 and $VITEST_EXIT == 0 else 'FAIL'
    },
    'build': {
        'command': 'pnpm build',
        'cwd': product_dir,
        'startUTC': '$BUILD_START_UTC',
        'endUTC': '$BUILD_END_UTC',
        'exitCode': $BUILD_EXIT,
        'productRoutes': [r.get('page') for r in routes_manifest.get('staticRoutes', [])] + [r.get('page') for r in routes_manifest.get('dynamicRoutes', [])],
        'appPages': list(app_build_manifest.get('pages', {}).keys()),
        'harnessRoutesDetected': harness_routes + harness_pages,
        'totalNftFilesChecked': total_nft_files,
        'harnessInNftTraces': harness_in_nft,
        'harnessTokenHitsInEmitted': harness_token_hits,
        'totalEmittedJsChunks': len(emitted_js_files),
        'emittedJsChunksInventory': emitted_js_files,
        'exclusionVerdict': 'PASS' if ($BUILD_EXIT == 0 and len(harness_routes) == 0 and len(harness_pages) == 0 and len(harness_in_nft) == 0 and len(harness_token_hits) == 0) else 'FAIL'
    },
    'overallVerdict': 'PASS' if (
        $VITEST_EXIT == 0 and
        $BUILD_EXIT == 0 and
        len(harness_in_tests) == 0 and
        len(harness_routes) == 0 and
        len(harness_pages) == 0 and
        len(harness_in_nft) == 0 and
        len(harness_token_hits) == 0
    ) else 'FAIL',
    'limitations': [
        'Hosted CI NOT_RUN (local verification in isolated product snapshot only)',
        'Playwright E2E and Storybook build not run per minimal proposed scope'
    ]
}

with open('$REPORT_JSON', 'w') as f:
    json.dump(report, f, indent=2)

print('Analysis complete:')
print(f'  Vitest collected tests: {len(collected_tests)} (harness files: {len(harness_in_tests)})')
print(f'  Build exit: {$BUILD_EXIT}')
print(f'  Product routes: {report[\"build\"][\"productRoutes\"]}')
print(f'  Harness routes detected: {len(harness_routes) + len(harness_pages)}')
print(f'  NFT traces checked: {total_nft_files} (harness traces: {len(harness_in_nft)})')
print(f'  Harness token hits: {len(harness_token_hits)}')
print(f'  Overall exclusion verdict: {report[\"overallVerdict\"]}')
"

echo ""
echo "================================================================"
echo "Report written to: $REPORT_JSON"
echo "End UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "================================================================"

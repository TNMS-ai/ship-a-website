#!/usr/bin/env bash
# Token-usage lint (R-03)
# Enforces two rules across src/components/** and src/layouts/**:
#   1. No raw hex colors (#xxx or #xxxxxx) — must use design tokens.
#   2. No ink-400 / --color-ink-400 — fails WCAG contrast at font-size < 24px.
# Only src/styles/global.css is allowed to define raw hex values.

set -euo pipefail

SCAN_DIRS=("src/components" "src/layouts")
FAILED=0

# ── Rule 1: raw hex colors ────────────────────────────────────────────────────
echo "==> Checking for raw hex colors in components and layouts..."
RAW_HEX=$(grep -rn --include="*.astro" --include="*.css" --include="*.scss" \
  -E '#[0-9a-fA-F]{3,8}\b' "${SCAN_DIRS[@]}" 2>/dev/null || true)

if [[ -n "$RAW_HEX" ]]; then
  echo ""
  echo "❌ RAW HEX VIOLATION — use design tokens from src/styles/global.css instead:"
  echo "$RAW_HEX"
  echo ""
  FAILED=1
else
  echo "   ✓ No raw hex colors found."
fi

# ── Rule 2: ink-400 usage ─────────────────────────────────────────────────────
echo "==> Checking for ink-400 / --color-ink-400 usage..."
INK400=$(grep -rn --include="*.astro" --include="*.css" --include="*.scss" \
  -E '(ink-400|--color-ink-400)' "${SCAN_DIRS[@]}" 2>/dev/null || true)

if [[ -n "$INK400" ]]; then
  echo ""
  echo "❌ INK-400 VIOLATION — ink-400 fails WCAG contrast at font-size < 24px (§2.4):"
  echo "$INK400"
  echo ""
  FAILED=1
else
  echo "   ✓ No ink-400 usage found."
fi

# ── Result ────────────────────────────────────────────────────────────────────
if [[ $FAILED -ne 0 ]]; then
  echo ""
  echo "Token lint failed. Fix the violations above before merging."
  exit 1
fi

echo ""
echo "Token lint passed."

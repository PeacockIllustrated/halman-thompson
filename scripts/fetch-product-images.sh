#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Download the AI-generated homepage product images (Higgsfield · recraft_v4_1)
# into public/images/products/ so they are self-hosted in the repo instead of
# hotlinked from the Higgsfield CDN.
#
# Usage (run from the repo root):
#   bash scripts/fetch-product-images.sh
#
# Then, in src/app/page.tsx, replace each PRODUCT_IMAGES URL with
# `/images/products/<id>.png` and remove the cloudfront entry from
# next.config.ts. Consider swapping these for real Halman Thompson photography.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

CDN="https://d8j0ntlcm91z4.cloudfront.net/user_36NAYfrLGRPm9X8eMUGIsi9s8ES"
DEST="public/images/products"
mkdir -p "$DEST"

declare -A IMAGES=(
  [splashback]="$CDN/hf_20260712_182930_61966949-9ba3-4f43-af57-d0813e12548b.png"
  [worktop]="$CDN/hf_20260712_183327_d892c711-d7a2-467e-9174-e44be5432f7b.png"
  [bar_top]="$CDN/hf_20260712_183329_34326235-2325-48f7-b473-efe1a9399b01.png"
  [wall_panel]="$CDN/hf_20260712_183335_e3370112-2a85-4486-b9dd-566f64a0b1f7.png"
  [table_top]="$CDN/hf_20260712_183337_faf56d4a-ba7b-42cc-8b7c-951d2e1ba3d8.png"
  [signage]="$CDN/hf_20260712_183344_1b7f6bbb-787a-4073-b3b7-4f6ff63a5d6a.png"
)

for id in "${!IMAGES[@]}"; do
  echo "Downloading ${id}.png ..."
  curl -fSL "${IMAGES[$id]}" -o "$DEST/${id}.png"
done

echo "Done. ${#IMAGES[@]} images saved to $DEST/"

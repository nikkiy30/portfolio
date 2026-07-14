#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist data images
find dist -mindepth 1 -maxdepth 1 -exec rm -rf {} +

mkdir -p dist/data dist/images

find . -maxdepth 1 -type f -name "*.html" ! -name "*-admin.html" -exec cp {} dist/ \;
cp styles.css script.js favicon.png dist/
cp data/*.js dist/data/

if find images -maxdepth 1 -type f | grep -q .; then
  cp images/* dist/images/
fi

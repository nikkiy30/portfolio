#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist data images
find dist -mindepth 1 -maxdepth 1 -exec rm -rf {} +

mkdir -p dist/data dist/images

cp index.html about.html portfolio.html learning.html styles.css script.js favicon.png dist/
cp data/*.js dist/data/

if find images -maxdepth 1 -type f | grep -q .; then
  cp images/* dist/images/
fi

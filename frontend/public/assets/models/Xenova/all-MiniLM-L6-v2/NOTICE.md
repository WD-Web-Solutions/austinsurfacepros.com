# all-MiniLM-L6-v2 browser model

This directory contains the quantized ONNX distribution of
[`Xenova/all-MiniLM-L6-v2`](https://huggingface.co/Xenova/all-MiniLM-L6-v2),
derived from `sentence-transformers/all-MiniLM-L6-v2` for Transformers.js.

- License: Apache License 2.0 (see `LICENSE`)
- Purpose: same-origin, in-browser semantic search for public blog posts
- Runtime: `@huggingface/transformers`
- Downloaded: 2026-08-09
- Model file SHA-256: `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`

Search queries and article content are processed in the visitor's browser. The
application disables remote model loading and serves these files from its own
origin.

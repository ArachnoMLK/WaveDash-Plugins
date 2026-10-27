# WaveDash-Plugins

Official plugin catalog of [WaveDash](https://github.com/ArachnoMLK/WaveDash). WaveDash reads `index.json` from this repository and offers these plugins in **Plugins › Catalog**.

## Security

- WaveDash only reads **this** repository (address built into the app, not editable).
- `index.json` is **signed** (Ed25519, file `index.json.sig`). WaveDash contains the public key (`catalog-public.pem`) and rejects an index that is not signed by the owner's private key. That key is never in the repository: even someone able to write here could not publish a plugin.
- Each `.wdsh` package is checked against its SHA-256 hash (in the signed index) before install; a different file is rejected.
- Installing always shows the requested permissions. An update is automatic only if the permissions are identical.
- Plugins run in the WaveDash sandbox (QuickJS, network limited to the declared domains, one read-only folder). See [docs/PLUGINS.md](https://github.com/ArachnoMLK/WaveDash/blob/main/docs/PLUGINS.md).
- Every contribution goes through a pull request reviewed by the repository owner.

## Adding or updating a plugin

1. A `plugins/<name>/` folder with `manifest.json` and the script (`main.js`). Bump `version` on every change. Write texts English first (`{ "en": "…", "fr": "…" }`), and code, comments and identifiers in English.
2. `node tools/build.mjs`: packs `packages/<id>-<version>.wdsh`, updates `index.json` and signs it. The private key is read from `../wavedash-catalog-private.pem` (or `WAVEDASH_CATALOG_KEY`): only the repository owner can publish; a pull request is merged then signed by them.
3. Commit all three (sources, package, index), then open a pull request. The **Check** action rejects an index that does not match the sources.

## License

MIT

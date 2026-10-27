# drone-law

A downloadable, community-maintained dataset of drone laws and regulations, initially focused on the United States. The dataset works without a website, API key, database, or Cloudflare account.

**There are no real legal records yet.** The examples are fictional software fixtures, not flight guidance. Actual legal research and population are a later phase.

## Find the data

| Path                                                       | Purpose                                                |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| [`data/regulations/`](data/regulations/)                   | Authoritative regulation records, one JSON file per ID |
| [`data/jurisdictions/`](data/jurisdictions/)               | Shared jurisdiction metadata and boundaries            |
| [`data/examples/`](data/examples/)                         | Fictional examples, excluded from published downloads  |
| [`schema/dataset.schema.json`](schema/dataset.schema.json) | Machine-readable record and dataset contract           |
| [`spec/dataset.md`](spec/dataset.md)                       | Field meanings, geographic limits, and versioning      |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                       | Submit, edit, review, and withdraw a record            |

The [Astro website lives in a separate repository](https://github.com/broski-lib/drone-law-website). Website issues and presentation changes belong there. Data changes belong here.

## Validate and download locally

Use Node.js 22.23.4 or later and pnpm 12.15.0.

```sh
pnpm install
pnpm run check
```

The build writes directly usable files to `dist/`:

- `regulations.json` contains normalized records and jurisdictions.
- `regulations.geojson` contains one feature per regulation and jurisdiction pair.
- `regulations.csv` contains regulation rows with nested values encoded as JSON.
- `dataset.schema.json` and `dataset.d.ts` describe the format.
- `manifest.json` identifies the content revision and every artifact's SHA-256 hash.
- `examples/` contains separate, explicitly fictional downloads.

Published downloads are empty until reviewed real records are added. All GeoJSON coordinates use longitude, latitude in WGS 84. Unknown boundaries remain `null`.

Tagged releases can distribute the generated files through GitHub Releases. The website vendors a checksum-pinned snapshot so its build never silently follows `main`.

## Reuse and limitations

Original dataset contributions use [CC0 1.0](DATA-LICENSE.md). Tooling uses [MIT](LICENSE). Source-specific rights still apply to third-party material.

No matching records does not mean flying is permitted. This is not a live airspace, temporary-flight-restriction, or authorization service. An OGC query API is deferred, not required to use the dataset.

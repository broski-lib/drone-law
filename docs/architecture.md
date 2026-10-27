# Data-first architecture

This is the current implementation decision. The [storage research](storage-options.md) records the database trade-offs that led here; it is not the current delivery scope.

`drone-law` is the authoritative data repository. It owns individual records, JSON Schema, the dataset specification, fictional fixtures, validation, an optional proposal importer, and versioned downloadable artifacts. It needs no database or website.

`drone-law-website` is a separate Astro and Cloudflare Workers application. It vendors a checksum-pinned data snapshot. Public pages and downloads are static. D1 stores only private submissions and review events. Cloudflare Access protects owner tools. An optional GitHub token can prepare draft data pull requests, never merge them automatically.

The published dataset starts empty. Two explicitly fictional regulations and two fictional jurisdictions exercise the format without researching actual laws. Examples remain separate from published downloads.

Publication requires a reviewed data change, a data release or validated build, and an explicit website snapshot update. Accepting an inbox suggestion is not publication. A website database is not a second source of truth.

Original structured data contributions use CC0 1.0. Software uses MIT. Third-party sources and geometry retain their upstream terms.

An OGC query API and database-backed public read model are deferred. JSON, GeoJSON, and CSV downloads are the initial public interface. Future APIs can derive from the same source files without changing the data's ownership or contribution path.

# Dataset format 0.1.0

The authoritative contract is [`schema/dataset.schema.json`](../schema/dataset.schema.json), a JSON Schema Draft 7 document. Types and aggregate downloads are generated from that contract and the individual source files.

## Regulations

Each regulation has a stable lowercase `id`, a `title`, an original plain-language `summary`, and one or more `jurisdiction_ids`. The ID identifies a curated legal reference, not a flight authorization.

`authority` identifies the issuing body. `topics` distinguishes flight restrictions from takeoff and landing, property use, privacy, registration, pilot qualifications, and other rules. These categories do not resolve preemption or determine legal enforceability.

`legal_status` is `effective`, `future`, `repealed`, or `unknown`. It is independent of contribution review. Only owner-reviewed records enter the published directories. Future records require `effective_from`. Repealed records require `effective_until`.

Effective dates use calendar dates in `YYYY-MM-DD` form. `null` means unknown, not unlimited permission. `effective_until` is the last effective calendar date, inclusive. Sub-day changes and local-time interpretation require source consultation. The start cannot follow the end.

`sources` contains official URLs, titles, precise citations, the date each source was checked, and rights notices. URLs use HTTPS and cannot contain credentials. The project stores original summaries rather than wholesale copies of source documents. `reviewed_on` is the last human source review date, not a build time or a claim of legal accuracy.

`supersedes` references earlier records retained in the dataset. Do not reuse IDs for unrelated laws. Keep repealed records with their status and dates rather than deleting legal history. Erroneous records can be removed through an explained pull request. Git history retains the reason and old value.

## Jurisdictions and geometry

Jurisdictions have a stable ID, a name, a level, an ISO-style two-letter country code, and an optional parent ID. References must exist and parent chains must not cycle.

`geometry` is `null`, a GeoJSON Polygon, or a MultiPolygon. Coordinates are two-dimensional WGS 84 longitude, latitude. Rings must close. Use counterclockwise exterior rings and clockwise holes following RFC 7946. The validator checks coordinate ranges, ring closure, and distinct vertices, not complete topology or boundary accuracy.

Known geometry requires `geometry_source`, including the URL, license, and accuracy statement. Unknown geometry requires a null source. A state's rectangle or approximate map point is not a substitute for its boundary. Handle antimeridian-crossing geometry according to RFC 7946 before importing it.

Geometry describes a jurisdiction, not necessarily the precise area in which every provision applies. Summaries and source citations must explain site-specific applicability. Never interpret a geographic match as permission or a definitive legal judgment.

## Downloads

`regulations.json` contains `schema_version`, `kind`, `license`, `jurisdictions`, and `regulations`. Records are sorted by filename. Builds are deterministic and do not include wall-clock timestamps.

The GeoJSON export has one feature for each regulation and jurisdiction pair. A feature ID is `<regulation-id>:<jurisdiction-id>`. `properties.id` remains the regulation ID. Several features can represent one regulation, so feature count is not regulation count. Unknown geometry remains null.

CSV encodes arrays and source objects as JSON inside quoted cells. Values that could execute as spreadsheet formulas receive a leading apostrophe. JSON is the lossless format.

`manifest.json` hashes every artifact. Its `revision` is the SHA-256 digest of its formatted file-hash map. The revision changes when a record, schema, generated type, or license artifact changes. It is a content identifier, not a Git commit or a review timestamp.

## Examples and publication

`kind: examples` and `is_example: true` identify fictional fixtures. Their IDs start with `example-`, and citations use reserved `.invalid` domains. Published datasets reject these flags and IDs. Examples and published records cannot share references across their separate datasets.

The empty published dataset makes no coverage claim. Consumers must not treat absence as legal permission. The repository has no OGC conformance claim and no live query service.

## Compatibility

Version 0.1.0 is an experimental contract. Consumers should pin a release or content revision. Field removal, renamed meanings, and new required fields require a schema version change. Preserve IDs through edits. Record changes are reviewed separately from software changes.

Original structured contributions use CC0 1.0. Cited sources and imported geometry retain their upstream terms. The dataset license does not override them.

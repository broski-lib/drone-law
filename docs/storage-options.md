# Storage research and decision

Status: historical research supporting the current decision. The current implementation is described in the [data-first architecture](architecture.md). No public read database or OGC query API is implemented. D1 stores only the website's private submission and review inbox. No cloud resources have been created.

The owner chose public Git JSON and GeoJSON as the source of truth. Website submissions enter a private D1 inbox, owner review produces a structured Git change, and a reviewed merge plus an explicit website snapshot update publishes a new revision. CC0 applies to original dataset contributions.

This page keeps the database and licensing research that led to that choice. It is not a description of the running application. Recheck current provider limits before changing the storage model.

The practical spatial caveat remains. For a small jurisdiction dataset, candidate selection followed by tested geometry filtering may be sufficient. If indexed point-in-polygon, distance, or intersection queries become central, a PostGIS-backed read model is the stronger option. Do not call bounding-box overlap a precise legal applicability check.

## Alternatives considered

These were the workflows compared. They are not the current implementation. Database products do not provide this project's contribution review process automatically.

| Option                                                          | Contributions and owner editing                                                                                                                                                                                 | Portability and audit                                                                                                                                                                                | Spatial queries and operations                                                                                                                                                                                           |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Git canonical, D1 derived, private inbox                     | Public pull requests. Website submissions remain private until reviewed. Approval and owner edits create Git changes. Merge triggers read-model publication.                                                    | Plain files can be cloned, forked, and rebuilt elsewhere. Commits provide public diffs. Review discussion remains in the Git host unless exported.                                                   | D1 stores searchable metadata, geometry JSON, and bounds. Worker performs exact geometry checks. Moderate complexity from Git automation and publication synchronization.                                                |
| 2. Postgres with PostGIS through Hyperdrive, public Git exports | Website submissions and owner edits use staged records and reviewed transactions. Public pull requests against exports need a validated importer with conflict checks.                                          | Standard Postgres plus JSON and GeoJSON exports. Requires explicit revision records, reviewer decisions, and export version identifiers. Export commits alone do not capture every database edit.    | Native spatial types, GiST indexes, intersections, and meter-based distance queries. Most infrastructure: external database, credentials, backups, Hyperdrive, migrations, and export/import jobs. [4][5][6]             |
| 3. Git-only versioned files and build dataset                   | Excellent pull-request workflow. Owner editing uses Git or a Git-backed editor. A durable private, non-Git submission page still needs a separate inbox service, otherwise it is not this complete requirement. | Plain files and commit history. Every published change waits for a build and deployment.                                                                                                             | Generate indexes at build time, then query files in the Worker. Static downloads alone do not implement dynamic OGC filters. Lowest database overhead, but geometry size and rebuild time can become constraints. [7][8] |
| 4. D1 canonical, public exports                                 | Direct owner CRUD and a private moderation queue. Public pull requests need an importer, not changes to ignored export files.                                                                                   | Add revision and decision tables. Publish deterministic JSON and GeoJSON snapshots. SQL export supports database recovery and migration, but is not a substitute for portable dataset downloads. [9] | Same spatial limitation as option 1. Simpler editing path, but more custom public audit and contribution integration work.                                                                                               |

GitHub pull requests support diffs, reviews, commits, and checks. A clone preserves Git history, not all host-side review metadata. [7]

For every option, keep submitter contact details, spam, rejected proposals, and internal notes out of public Git and exports. Approval should publish only the reviewed record. Preserve stable IDs, source URLs, source license, effective dates, retrieval dates, and review dates. Removal needs a revision or tombstone, not unexplained disappearance. These are design recommendations, independent of storage choice.

Approval and publication are separate states. A failed build must not appear as a successful live update. The private inbox needs its own backup and retention policy.

## Spatial support is the deciding constraint

- D1 documents SQLite semantics and supported FTS5, JSON, and math extensions. It does not document PostGIS, SpatiaLite, or a user-installable extension mechanism. Do not plan to install arbitrary SQLite extensions. Native spatial SQL is not a documented D1 capability. [1]
- R-tree availability must not be inferred from SQLite generally or a local runtime. Cloudflare's underlying `workerd` build enables R-tree, but D1's published extension list does not promise it. No remote capability test was performed for this research. [1][10]
- Numeric west, south, east, and north columns can select candidates in D1. Their overlap can produce false positives for polygons with holes or irregular boundaries. Geometry predicates must filter candidates before pagination and counts, or the API can return incorrect pages.
- OGC API Features Part 1, requirement 24, requires the feature geometry to intersect the requested `bbox`, including boundary contact. It also matches features without geometry. Envelope-overlap alone is not conformant for arbitrary polygons. The standard defines API behavior, not a required database. [11]
- Neon and Supabase both explicitly support PostGIS. This supplies spatial types and GiST indexing. Neon documents `ST_Intersects` and `ST_DWithin`, with meter units for geography. The chosen coordinate system still matters. [4][5]
- Cloudflare documents Hyperdrive connections to both providers using direct database connections, not their existing pooler endpoints. Hyperdrive pools connections; it is not the database. Its default query cache does not invalidate on writes, so moderation, permissions, and immediate read-after-write paths need cache-disabled access. [6][12][22]

## Relevant limits, not a billing estimate

These limits can change. Recheck before choosing a provider. Large jurisdiction geometries, index storage, and revisions count toward database capacity too.

| Service                  | Current relevant constraints                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 Free                  | 10 databases, 500 MB per database, 5 GB total account storage. 5 million rows read and 100,000 rows written per day. Exhaustion makes queries fail. Rows scanned count, not just rows returned. [2][3]                                                                                                          |
| D1 Paid                  | 10 GB maximum per database, not an indefinitely expandable single database. Maximum row, string, or BLOB size is 2 MB on both plans. Time Travel is 7 days on Free and 30 days on Paid, not a permanent editorial audit. [2]                                                                                    |
| Hyperdrive Free          | 100,000 database statements per day, including cached queries and writes. Provider database limits apply separately. [13]                                                                                                                                                                                       |
| Neon Free                | 1 GB Postgres storage per project and 20 GB account total. 100 CU-hours per project per month, 5 GB monthly public egress per project. Compute scales to zero after 5 minutes. Exhausted compute or egress suspends compute until reset; storage exhaustion blocks writes. [14]                                 |
| Supabase Free            | 500 MB database per project, 2 active projects, 5 GB egress. Projects pause after a week of inactivity. Automatic backups are not included on Free. [15]                                                                                                                                                        |
| Workers and static files | Free Worker execution has 100,000 requests per day and 10 ms CPU per request. Memory is 128 MB per isolate on both plans. Static assets allow 20,000 files on Free, 100,000 on Paid, and 25 MiB per file. Direct static asset requests are free and unlimited, unlike requests that invoke Worker code. [8][16] |
| GitHub dataset files     | Regular Git warns above 50 MiB and blocks files above 100 MiB. Keep canonical records split into reviewable files. Large generated downloads can be release artifacts rather than repeated full snapshots in Git history. [17]                                                                                  |

## Data license choices

For maximum reuse, recommend CC0 for original dataset material and database rights the project can actually dedicate. CC0 permits commercial reuse and modification without attribution obligations. Preserve provenance and offer suggested citation anyway. [18]

CC BY 4.0 is an alternative if required attribution matters more than minimal reuse friction. It requires credit, a license link, and indication of changes. ODbL adds database attribution and share-alike obligations for publicly used adapted databases. Choose ODbL only if reciprocal database sharing is an explicit goal, not merely because the dataset is geographic. [19][20]

These are licensing trade-offs, not legal conclusions. Neither hosting public files nor applying CC0 overrides upstream rights. Check each imported source's terms, record required notices, and obtain contributor agreement to the chosen outbound terms. Do not presume every government map, compilation, or third-party legal summary is public domain. Keep the software license separate from dataset terms. [18][19][21]

[1]: https://developers.cloudflare.com/d1/sql-api/sql-statements/
[2]: https://developers.cloudflare.com/d1/platform/limits/
[3]: https://developers.cloudflare.com/d1/platform/pricing/
[4]: https://neon.com/docs/extensions/postgis
[5]: https://supabase.com/docs/guides/database/extensions/postgis
[6]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/
[7]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
[8]: https://developers.cloudflare.com/workers/platform/limits/
[9]: https://developers.cloudflare.com/d1/best-practices/import-export-data/
[10]: https://github.com/cloudflare/workerd/blob/main/build/BUILD.sqlite3
[11]: https://docs.ogc.org/is/17-069r4/17-069r4.html#_parameter_bbox
[12]: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/
[13]: https://developers.cloudflare.com/hyperdrive/platform/pricing/
[14]: https://neon.com/docs/introduction/plans
[15]: https://supabase.com/pricing
[16]: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
[17]: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
[18]: https://creativecommons.org/publicdomain/zero/1.0/
[19]: https://creativecommons.org/licenses/by/4.0/
[20]: https://opendatacommons.org/licenses/odbl/summary/
[21]: https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-databases
[22]: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/

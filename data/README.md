# Data directory

This directory is the source of truth. It is not an export from the website.

Add real reviewed records to `regulations/` and their jurisdictions to `jurisdictions/`. Use the record ID as the filename. Keep one record per file to make diffs reviewable.

`examples/` contains fictional test data. Every example has `is_example: true`, an `example-` ID, and reserved `.invalid` source URLs. Examples are built into separate downloads and never mixed into the published dataset.

`metadata.json` defines the schema version and dataset license. Field semantics are in [`spec/dataset.md`](../spec/dataset.md). The [JSON schema](../schema/dataset.schema.json) defines required fields and permitted values.

Do not put contributor contact details, raw submission messages, or internal review notes here. Git history is public and persistent.

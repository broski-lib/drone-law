# Contribute data

Actual legal research and population are deferred for the initial software build. Fictional examples show the format without claiming to describe real laws.

## Propose a change

1. Create a branch or fork.
2. Add or edit a JSON record in `data/regulations/`. Name the file `<id>.json`.
3. Add any missing jurisdiction to `data/jurisdictions/`.
4. Include an official source URL, a precise section citation, a source-check date, and rights notices.
5. Run `pnpm install` and `pnpm run check`.
6. Open a pull request with the reason for the change and any uncertainty.

Start from a fictional record in `data/examples/`, but replace all invented content before proposing a real record. Set `is_example: false` and choose an ID without the `example-` prefix. Never put contact details or private correspondence in a data record.

For format changes, update the schema, specification, validator, and tests together. Do not edit generated downloads or generated TypeScript declarations.

## Suggest a change without Git

The separate website provides a private contribution form after its deployment is configured. A maintainer turns accepted submissions into reviewed changes here. Until the website is available, use a repository issue with public-safe information only. GitHub issues require an account and are public.

## Owner review

For a structured proposal downloaded from the website, apply it on a branch:

```sh
pnpm run proposal:apply -- /path/to/proposal.json --dry-run
pnpm run proposal:apply -- /path/to/proposal.json
git diff
pnpm run check
```

Inspect the proposed content before applying it. The importer validates the complete affected dataset before writing, rejects stale base records, and does not commit or publish anything. Reapplying the same change is a no-op. Changes that need several coordinated records should use a normal multi-file pull request instead.

For each proposed record, inspect the official source, applicability, effective dates, geometry provenance, original summary, and redistribution rights. Automated checks prove structural validity, not legal correctness.

The owner can edit the proposal, request evidence, reject it, or merge it. Approval in the website means accepted for a data pull request, not already published. Publication happens only after a reviewed merge and a versioned release or website snapshot update.

Use GitHub branch protection or a ruleset on `main` to require pull requests and the `validate` check. Restrict merging to trusted maintainers. Repository files cannot configure those hosting policies automatically.

For an edit, preserve the ID and explain the correction. For a repeal, preserve the record and set its status and last effective date. Remove an erroneous record through a pull request that explains why. Keep replacement references valid.

## Contribution terms

Submit only material you have the right to contribute. Original structured contributions use the CC0 1.0 terms in `DATA-LICENSE.md`. Do not claim that CC0 overrides an upstream license. Tooling contributions use MIT.

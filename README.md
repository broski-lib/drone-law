# drone-law

A small, downloadable dataset of drone rules for developers. It is incomplete and updated as rules are researched and verified; laws and rules change.

Each rule states, in plain language, who it applies to, whether it restricts or allows the flight, an official source, and the date it was checked. The dataset supplies the static rules. Live TFRs, airspace class, stadium schedules, and daylight times come from other sources.

**Not legal advice. A missing rule means "not researched or not included," not "allowed."**

## Download

- [`dataset.json`](dataset.json) — the dataset.
- [`schema.json`](schema.json) — the JSON Schema contract.

Pin a commit or tag in production; `main` can change.

There is no build, database, website, or custom validation script.

## Rule example

```json
{
  "id": "columbus-metro-parks",
  "jurisdictions": ["columbus-oh", "franklin-county-oh"],
  "category": "local",
  "type": "allowance",
  "applies_to": "recreational",
  "scope": "Columbus & Franklin County Metro Parks during park hours",
  "title": "Metro Parks allow hobby flying during park hours",
  "message": "Recreational drone flying is allowed in all Columbus & Franklin County Metro Parks during park hours, except in state nature preserves, and only at the discretion of on-duty Park Rangers. Contact the rangers before flying. Scioto Grove has a designated drone field.",
  "source": {
    "label": "Metro Parks FAQ: drone use",
    "url": "https://www.metroparks.net/faqs/"
  },
  "checked_on": "2026-10-27"
}
```

## Jurisdictions

Jurisdictions are listed once at the top level:

```json
{
  "id": "ohio",
  "name": "Ohio",
  "level": "state",
  "codes": {
    "iso_3166_2": "US-OH",
    "fips_state": "39"
  }
}
```

Rules reference these IDs. `codes` is optional and holds standard identifiers where available: ISO 3166-1/2 for country and state, and FIPS state, county, or place for U.S. locations.

IDs are local slugs. OGC API - Features does not define a jurisdiction ID format, so these work as local IDs; the codes support mapping to standard datasets.

## Fields

The top level has `schema_version`, `updated`, `license`, `notes`, `jurisdictions`, and `rules`.

| Rule field | Meaning |
| --- | --- |
| `id` | Stable lowercase identifier. Do not reuse it for a different rule. |
| `jurisdictions` | IDs of the places where the rule applies. Each ID must exist in the top-level `jurisdictions` array. |
| `category` | UI grouping: `airspace`, `tfr`, `stadium`, `state`, `local`, or `other`. |
| `type` | `restriction` (warning), `allowance` (allowed), or `notice` (information). |
| `applies_to` | Operation type: `all`, `part-107`, or `recreational`. |
| `scope` | Display text for where or when the rule applies, such as "Ohio state parks" or "within 3 NM of a qualifying stadium." Not used for machine filtering; use `jurisdictions` for matching. |
| `title` | Short card heading. |
| `message` | Plain-language rule, including the practical limit, exception, or action. |
| `source` | Official source. `label` is the link text; `url` is the destination. |
| `checked_on` | Date a human last checked the source. |

## Using the dataset

Match the flight location to jurisdiction IDs using your own geocoder. For a flight in Columbus, that is typically `columbus-oh`, `franklin-county-oh`, `ohio`, and `united-states`. Then filter the rules:

```js
const locationIds = new Set([
  "columbus-oh",
  "franklin-county-oh",
  "ohio",
  "united-states",
]);

const applicable = dataset.rules.filter((rule) =>
  rule.jurisdictions.some((id) => locationIds.has(id)),
);
```

Filter by `applies_to` for the operation you support: `all`, `part-107`, or `recreational`.

Render `type` as the status:

- `restriction` -> warning
- `allowance` -> allowed / check
- `notice` -> information

`type` describes the rule itself. A section such as "Local rules apply" can still use a warning style to prompt review, even when an individual rule is an allowance.

Use `category` to group sections. The dataset intentionally uses a few broad categories so developers can present their own UI.

The top-level `notes` array contains caveats that apply to the whole dataset.

## Static, not live

This dataset does not contain live TFRs, current airspace class, stadium schedules, or sunrise and sunset. It contains the static rule text that those checks depend on. Combine it with live FAA data.

The TFR and stadium records are reminders of the rules; the actual active restrictions and event times change.

## Validate

CI validates `dataset.json` against `schema.json` on every push and pull request using `ajv-cli`, then checks IDs and references. To run the same checks locally:

```sh
npx --yes -p ajv-cli@5 -p ajv-formats@3 ajv validate -s schema.json -d dataset.json --strict=true -c ajv-formats
jq -e '([.jurisdictions[].id] | length) == ([.jurisdictions[].id] | unique | length)' dataset.json
jq -e '([.rules[].id] | length) == ([.rules[].id] | unique | length)' dataset.json
jq -e '(.jurisdictions | map(.id)) as $ids | all(.rules[].jurisdictions[]; . as $id | $ids | index($id) != null)' dataset.json
```

## Add or update a rule

1. Add or edit one object in `rules`.
2. Add any missing place to the top-level `jurisdictions` array, with standard `codes` when available.
3. Reference jurisdictions by ID.
4. Use an official `source` and set `checked_on` to the date you checked it.
5. Update the top-level `updated` date.
6. Run the validation commands or open a pull request; CI checks the format.

## Scope

The dataset is partial and U.S.-focused. See `dataset.json` for the rules and jurisdictions currently included. It does not include live airspace, full legal text, waivers, private-land rules, or property-rights questions below the FAA ceiling. No record here sets a private-property altitude floor.

## License

Original dataset content is CC0 1.0. Cited law and source text keep their own terms. See [`DATA-LICENSE.md`](DATA-LICENSE.md) and [`LICENSE`](LICENSE).

# drone-law

A small, downloadable dataset of static drone rules for vendors and flight-planning tools. It starts with Columbus, Ohio.

The goal is the kind of briefing shown in a flight-planning app: a plain-language rule, who it applies to, whether it restricts or allows the flight, an official source, and the date it was checked. The dataset supplies the static rules. Live TFRs, airspace class, stadium schedules, and daylight times come from the consumer's own sources.

**Not legal advice. A missing rule means "not researched or not included," not "allowed."**

## Download

- [`dataset.json`](dataset.json) — the dataset.
- [`schema.json`](schema.json) — the JSON Schema contract.

Vendors should pin a commit or tag in production; `main` can change.

There is no build, database, website, or custom validation script. The top level of `dataset.json` has `schema_version`, `updated`, `license`, `notes`, and `rules`.

## A rule

```json
{
  "id": "columbus-metro-parks",
  "jurisdictions": [
    { "id": "columbus-oh", "name": "City of Columbus", "level": "city" },
    { "id": "franklin-county-oh", "name": "Franklin County", "level": "county" }
  ],
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

## Fields

Each rule has the following fields. The top level has `schema_version`, `updated`, `license`, `notes`, and `rules`.

| Field | Meaning |
| --- | --- |
| `id` | Stable lowercase identifier. Do not reuse it for a different rule. |
| `jurisdictions` | Places where the rule applies. Each has an `id`, `name`, and `level` (`federal`, `state`, `county`, `city`, `park-district`, `site`). A rule can list more than one. |
| `category` | UI grouping: `airspace`, `tfr`, `stadium`, `state`, `local`, or `other`. |
| `type` | `restriction` (warning), `allowance` (allowed), or `notice` (information). |
| `applies_to` | `all`, `part-107`, or `recreational`. |
| `scope` | Human-readable area or condition, such as "Ohio state parks" or "within 3 NM of a qualifying stadium." |
| `title` | Short card heading. |
| `message` | Plain-language rule, including the practical limit, exception, or action. |
| `source` | Official source. `label` is the link text; `url` is the destination. |
| `checked_on` | Date a human last checked the source. |

## For vendors

Match the flight location to jurisdiction IDs using your own geocoder. For a flight in Columbus, that is typically `columbus-oh`, `franklin-county-oh`, `ohio`, and `united-states`. Then filter the rules:

```js
const locationIds = new Set([
  "columbus-oh",
  "franklin-county-oh",
  "ohio",
  "united-states",
]);

const applicable = dataset.rules.filter((rule) =>
  rule.jurisdictions.some((place) => locationIds.has(place.id)),
);
```

Filter by `applies_to` for the operation you support: `all`, `part-107`, or `recreational`.

Render `type` as the status:

- `restriction` -> warning
- `allowance` -> allowed / check
- `notice` -> information

`type` describes the rule itself. A section such as "Local rules apply" can still use a warning style to prompt review, even when an individual rule is an allowance.

Use `category` to group sections. The dataset intentionally uses a few broad categories so vendors can present their own UI.

The top-level `notes` array contains dataset-wide caveats to show with the rules.

## Static, not live

This dataset does not contain live TFRs, current airspace class, stadium schedules, or sunrise and sunset. It contains the static rule text that those checks depend on. Consumers should combine it with live FAA data.

The TFR and stadium records are reminders of the rules; the actual active restrictions and event times change.

## Validate

CI validates `dataset.json` against `schema.json` on every push and pull request using `ajv-cli`, and checks that rule IDs are unique. To run the same checks locally:

```sh
npx --yes -p ajv-cli@5 -p ajv-formats@3 ajv validate -s schema.json -d dataset.json --strict=true -c ajv-formats
jq -e '([.rules[].id] | length) == ([.rules[].id] | unique | length)' dataset.json
```

## Add or update a rule

1. Add or edit one object in `dataset.json`.
2. Use a unique `id`, at least one jurisdiction, and an official `source`.
3. Set `category`, `type`, `applies_to`, `scope`, `title`, and `message`.
4. Set `checked_on` to the date you checked the source.
5. Update the top-level `updated` date.
6. Run the validation commands or open a pull request; CI checks the format.

## Coverage

- Federal: 400 ft ceiling, controlled airspace, TFRs, stadium restrictions.
- Ohio: critical facilities and emergency scenes, limits on local rules, state parks, nature preserves.
- Columbus and Franklin County: nature preserves, park permits, model aircraft, and Metro Parks rules for recreational and commercial flights.

Not covered: live airspace, other states or localities, full legal text, waivers, HOA or private-land rules, and property-rights questions below the FAA ceiling. No record here sets a private-property altitude floor.

## License

Original dataset content is CC0 1.0. Cited law and source text keep their own terms. See [`DATA-LICENSE.md`](DATA-LICENSE.md) and [`LICENSE`](LICENSE).

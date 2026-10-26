Real output from `scripts/measure.mts` (gpt-4o-mini, admin, "Build me a sales dashboard.").

- `admin-dashboard.jsonl`: one full run as the client receives it. Line 1 is the
  host's `/state/data` seed; everything after it is the model's, after
  `isPatchAllowed`.
- `admin-dashboard.trimmed.jsonl`: the same run trimmed to its essentials: one tile,
  one button, ids shortened, empty `children` and `params` dropped. Every
  figure is a `$state` path; the model wrote no number.

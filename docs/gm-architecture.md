# GM backend boundary

This public repository contains only the player-facing integration contract.

## Rule

The browser can consume a **sanitised player snapshot** only. It must never receive private campaign state and then attempt to hide parts of it in JavaScript or CSS.

## Player snapshot

The expected payload is:

```json
{
  "revision": 12,
  "publishedAt": "2026-09-25T20:15:00Z",
  "state": {},
  "threads": [],
  "discoveries": [],
  "records": {},
  "categories": {},
  "edges": []
}
```

`gm-bridge.js` accepts this shape and updates the player site.

## Private backend requirements

The separate GM system should:

- store all private campaign state outside this repository;
- expose no secret or service-role credential to the browser;
- require authenticated GM access for editing or publishing;
- generate a reviewed player-safe snapshot server-side;
- expose only that approved snapshot to the player site;
- keep private tables outside any public Data API surface where practical;
- use least-privilege access controls and Row Level Security on every exposed table.

The private implementation is deliberately not documented in this public repository.

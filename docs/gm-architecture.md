# Private GM backend architecture

The public GitHub Pages site is deliberately unable to read GM secrets.

## Boundary

The browser may read **one sanitised player snapshot** only.

The private backend owns all hidden campaign state:

- Strahd's current attention and pressure state
- NPC motives, loyalties and private knowledge
- unrevealed locations and encounters
- faction / location / threat clocks
- future events and consequences
- GM notes and candidate ideas
- the mapping between hidden facts and player-safe revelations

The public site receives only records explicitly promoted into a published snapshot.

## Recommended backend

Use a completely separate Supabase project for Barovia. Do not reuse the Greywake project.

### Private schema

Keep GM tables in a schema that is not exposed to the Data API.

Suggested tables:

- `gm.campaign`
- `gm.npc_state`
- `gm.location_state`
- `gm.threat_clock`
- `gm.secret`
- `gm.session_state`
- `gm.revelation_queue`

Every hidden row should have a stable ID, state, GM notes, last-updated timestamp and optional reveal rule.

### Published player layer

Create a single player-facing snapshot containing only approved data:

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

The public site consumes this shape through `gm-bridge.js`.

### Publication flow

1. GM changes private state.
2. A server-side publish action derives player-safe facts.
3. The GM reviews the outgoing snapshot.
4. Only the approved snapshot is written to the player-facing store.
5. The website reads that snapshot.

Never derive the player view in browser JavaScript from a larger secret payload.

## Security requirements

- No secret/service-role key in GitHub, GitHub Pages, JavaScript or browser storage.
- Private GM tables are not granted to `anon` or ordinary player clients.
- Enable RLS on every table in an exposed schema.
- Prefer a non-exposed schema for GM tables as an additional boundary.
- Player clients use only a publishable key or a public Edge Function endpoint.
- GM publishing requires authenticated GM access and server-side authorization.
- A player snapshot must contain no hidden IDs whose names themselves reveal spoilers.

## Strahd pressure model

Store Strahd's model privately as state, not as a visible score.

Suggested private fields:

- target character
- interest stage: observe / test / intrigue / isolate / claim / destroy
- last direct contact
- known leverage
- current misconception
- next likely move
- trigger conditions
- restraint / reason not to escalate
- history of reactions to party actions

The player site receives only observable consequences after the GM publishes them.

## Reactive clocks

A clock represents something that can change while the party is elsewhere.

Suggested fields:

- label
- owner/faction
- current step
- maximum step
- advance conditions
- regress conditions
- consequence at completion
- visibility: hidden / hinted / known
- player-safe hint text

Only `known` clocks belong in the player snapshot. `hinted` clocks should publish prose evidence, not the underlying numeric clock.

## Current status

The public integration boundary is implemented. The private database is intentionally not provisioned inside this public repository.

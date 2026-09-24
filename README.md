# Barovia — Daggerheart

A standalone campaign website for playing a Barovia campaign using the Daggerheart ruleset.

This repository is intentionally separate from the Greywake project. It shares design ideas, not code or deployment state.

## Campaign philosophy

- Barovia is a living campaign frame, not a chapter checklist.
- Daggerheart is the rules engine.
- Player-facing information follows **Known. Seen. Earned.**
- Unknown locations stay absent rather than appearing as locked spoilers.
- Current possibilities are choices, not quests assigned by the GM.
- NPCs, dangers and locations may change as the campaign progresses.
- The public site must never contain unrevealed GM-only material.

## Current structure

- `index.html` — standalone player-guide shell.
- `style.css` — Barovia-specific Gothic visual system.
- `data.js` — player-safe campaign state, known records, current possibilities and relationships.
- `app.js` — routing, navigation, search, record rendering and Player Brain.
- `character.js` / `character.css` — browser-local Daggerheart live-play sheet and Duality Dice roller.
- `gm-config.js` / `gm-bridge.js` — safe boundary for an approved player snapshot from a separate private GM backend.

## Important GM-data rule

This repository is public. Do **not** place hidden truths, future events, secret NPC motives, unpublished encounter information, or other spoilers in `data.js` or another frontend file.

A later GM control layer should use either:

1. a private repository,
2. private storage/API,
3. or a local GM-only data source that publishes only approved player-safe updates.

## Planned next layer

- Character-specific knowledge.
- Campaign journal.
- Better Player Brain relationship visualisation.
- Live update publishing from the private GM backend.
- Private reactive campaign-state tools.

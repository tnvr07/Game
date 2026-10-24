# The Moonbell Mix-Up

A whimsical, original top-down pixel-art adventure. The moon has misplaced its
bedtime bell, and Noodlewick's residents are having a very long day. Set out
with Pip, your floating lantern-sprite companion. Talk to Auntie Fizz, chase
the grumble-moths through the Upside-Down Woods, find the bell in the Teacup
Catacombs, and bring it home before the moon gets cranky. Explore the optional
Hush-Hush Glen, search its suspicious chest, and collect fizzy plum tonic.

## Development

This is a Phaser 3 + TypeScript + Vite project. Install dependencies, then run
the local dev server:

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, or serve that build with
`npm run preview`.

## Project layout

- `src/main.ts` configures Phaser, pixel rendering, and the game scene.
- `src/legacy-game.js` temporarily adapts the existing canvas game into a
  Phaser-managed texture while its gameplay systems are migrated.
- `src/style.css` contains the page and game frame styling.
- `index.html` is the Vite entry point.

The adapter preserves the current playable prototype while Phaser takes over
the game loop, scaling, rendering surface, and scene lifecycle. It is an
incremental migration: new game systems should be implemented in Phaser and
TypeScript rather than added to the adapter.

## Controls

- Move: `WASD` or arrow keys
- Fire a star spark (hold to fire): `Z` or `Space`
- Talk / interact: `E`
- Use a fizzy plum tonic: `Q`
- Expand / close the world map: `M`
- Select a hotbar slot: `1`–`9`
- Start or retry: `Enter`

The top-right minimap shows how the four regions connect. Press `M` to expand
it; the cyan marker shows your position, and a gold marker points to your
current story objective when one is active.

The four regions now have distinct original pixel-art palettes: bright candy
meadows, ember-lit woods, an icy glen, and sun-baked ruins. The in-game HUD
shows hearts and a nine-slot hotbar along the bottom of the screen.

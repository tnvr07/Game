import Phaser from "phaser";
import { createLegacyGame } from "./legacy-game.js";
import "./style.css";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 320;

class AdventureScene extends Phaser.Scene {
  private legacyGame?: ReturnType<typeof createLegacyGame>;

  constructor() {
    super("adventure");
  }

  create(): void {
    const frame = this.textures.createCanvas("legacy-frame", GAME_WIDTH, GAME_HEIGHT);
    if (!frame) throw new Error("Could not create the game frame texture.");
    this.add.image(0, 0, frame).setOrigin(0);
    this.legacyGame = createLegacyGame(frame.getCanvas(), () => frame.refresh());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.legacyGame?.destroy();
      this.legacyGame = undefined;
    });
  }

  update(_time: number, delta: number): void {
    this.legacyGame?.update(Math.min(40, delta) / 1000);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#315b4b",
  pixelArt: true,
  roundPixels: true,
  render: {
    antialias: false,
    pixelArt: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [AdventureScene]
});

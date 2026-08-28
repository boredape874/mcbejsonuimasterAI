import { system, world } from "@minecraft/server";

const PREFIX = "v2:minimap";

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const { x, z } = player.location;
    player.onScreenDisplay.setTitle(`${PREFIX}|x=${Math.floor(x)}|z=${Math.floor(z)}`, {
      fadeInDuration: 0,
      stayDuration: 25,
      fadeOutDuration: 0
    });
  }
}, 20);

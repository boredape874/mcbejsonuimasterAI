import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:responsive";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("Percentage-based shell with touch-safe forty-eight unit actions.");
  form = form.button("Primary action");
  form = form.button("Back");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

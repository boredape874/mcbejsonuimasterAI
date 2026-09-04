import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:quest";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("Two-page quest book with explicit title and body text regions.");
  form = form.button("Accept quest");
  form = form.button("Back");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:gallery";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("Text sizing, three button states, and nine-slice gallery.");
  form = form.button("Interactive sample");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

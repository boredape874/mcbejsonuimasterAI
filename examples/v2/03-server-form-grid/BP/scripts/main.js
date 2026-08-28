import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:grid";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("A measured three by two server-form button grid.");
  form = form.button("Profile");
  form = form.button("Quests");
  form = form.button("Rewards");
  form = form.button("Party");
  form = form.button("Settings");
  form = form.button("Close");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:casino";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("Five by three reel grid with a separate betting panel.");
  form = form.button("Decrease bet");
  form = form.button("Increase bet");
  form = form.button("Spin");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

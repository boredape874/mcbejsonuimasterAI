import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TITLE_TOKEN = "v2:daily";

function openExample(player) {
  let form = new ActionFormData().title(TITLE_TOKEN).body("Seven equal reward cards with claim states and fixed spacing.");
  form = form.button("Day 1");
  form = form.button("Day 2");
  form = form.button("Day 3");
  form = form.button("Day 4");
  form = form.button("Day 5");
  form = form.button("Day 6");
  form = form.button("Day 7");
  form = form.button("Claim");
  form.show(player).catch(() => undefined);
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.runTimeout(() => openExample(player), 30);
});

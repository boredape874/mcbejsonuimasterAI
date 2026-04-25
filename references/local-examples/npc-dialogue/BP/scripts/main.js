import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

world.afterEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;

  if (item?.typeId !== "minecraft:stick") return;

  const form = new ActionFormData()
    .title("두리")
    .body("와, 오")
    .button("아쌀")
    .button("장비 강화");

  form.show(player).then((res) => {
    if (res.canceled) return;
    player.sendMessage(`§e선택: §f${res.selection}`);
  });
});

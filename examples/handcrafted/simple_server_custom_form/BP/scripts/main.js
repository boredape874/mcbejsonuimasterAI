// Simple Server Custom Form — opener
// Trigger: /scriptevent ssc:open  (run as a player) or right-click compass item.
import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// IMPORTANT: title MUST begin with the prefix "customUI_SimpleServer_".
// server_form.json (RP) routes only forms whose #title_text starts with this
// prefix into our custom screen. Other forms keep vanilla appearance.
function openForm(player) {
  const form = new ActionFormData()
    .title("customUI_SimpleServer_Main")
    .body("Description Text!")
    .button("Btn1")
    .button("Btn2")
    .button("Btn3")
    .button("Btn4");

  form.show(player).then((res) => {
    if (res.canceled) return;
    const labels = ["Btn1", "Btn2", "Btn3", "Btn4"];
    player.sendMessage(`§a${labels[res.selection]} pressed`);
  }).catch((e) => {
    player.sendMessage(`§cform error: ${e}`);
  });
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "ssc:open") return;
  const src = ev.sourceEntity;
  if (!src || src.typeId !== "minecraft:player") return;
  openForm(src);
});

world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId === "minecraft:compass") openForm(ev.source);
});

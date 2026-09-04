import { ActionFormData } from "@minecraft/server-ui";
const form = new ActionFormData();
form.title("SHOP:main");
form.button("construction");
form.button("equipment");
const response = await form.show(player);
if (response.canceled) return;

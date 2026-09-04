import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
const shop = new ActionFormData().title("OTHER:main").button("equipment").button("construction");
const response = await shop.show(player);
const notice = new MessageFormData().title("NOTICE").button1("yes").button2("no");
const result = await notice.show(player);
if (result.canceled) return;

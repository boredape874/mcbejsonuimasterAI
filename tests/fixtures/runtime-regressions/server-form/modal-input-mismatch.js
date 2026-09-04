import { ModalFormData } from "@minecraft/server-ui";
const reply = new ModalFormData().title("REPLY:message");
const response = await reply.show(player);
if (response.canceled) return;

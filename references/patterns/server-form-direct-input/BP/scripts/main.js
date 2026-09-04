import { ModalFormData } from "@minecraft/server-ui";
const reply = new ModalFormData();
reply.title("REPLY:message");
reply.textField("Reply", "Type here", "");
const response = await reply.show(player);
if (response.canceled) return;
const [text] = response.formValues;

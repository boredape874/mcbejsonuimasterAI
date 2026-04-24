# Topbar Chat Notification Utility

Files:
- `topbar_chat_notification_utils.json`
- `topbar_chat_notification_hud_patch.json`
- `topbar_chat_notification_chat_screen_patch.json`

What it does:
- Shows a top-centered black notification bar from chat
- Slides down from the top
- Supports queue or stack behavior through `chat_item_factory`
- Supports `icon_path;message` payload format
- Hides flagged lines from the normal chat HUD and chat screen

Input format:
- `!topbar:Server restart in 5 minutes`
- `!topbar:textures/ui/bang_icon;Server restart in 5 minutes`

Integration:
1. Add `topbar_chat_notification_utils.json` to your `_ui_defs.json`.
2. Merge `topbar_chat_notification_hud_patch.json` into `hud_screen.json`.
3. Merge `topbar_chat_notification_chat_screen_patch.json` into `chat_screen.json`.

Important:
- `hud_screen.$additional_screen_content` can only point to one control.
- If your pack already uses `additional_screen_content`, wrap both controls into a parent panel or merge them manually.

Common overrides:
- Default icon:
  - `hud.topbar_chat_notification_item.$default_icon_texture`
- Trigger flag:
  - `hud.topbar_chat_notification_item.$notify_flag`
- Card size:
  - `hud.topbar_chat_notification_item.$item_size`
  - `hud.topbar_chat_notification_item.$card_size`
- Text layout:
  - `hud.topbar_chat_notification_item.$text_size`
  - `hud.topbar_chat_notification_item.$text_offset`
  - `hud.topbar_chat_notification_item.$text_scale`

Animation tuning:
- Fade alpha:
  - `topbar_chat_notification_utils.notification_alpha_in.to`
  - `topbar_chat_notification_utils.notification_alpha_out.from`
- Slide speed:
  - `topbar_chat_notification_utils.notification_slide_in.duration`
  - `topbar_chat_notification_utils.notification_slide_out.duration`
- Hold time:
  - `topbar_chat_notification_utils.notification_alpha_wait.duration`
  - `topbar_chat_notification_utils.notification_slide_wait.duration`

Reference working example:
- mirrored in this repository under `references/local-utils/json-ui-utils/`

# PMMP Integration Examples

These are protocol examples for server-driven JSON UI.

## Title-driven HP bar

```php
$player->sendTitle("customTitle_AniHPBar_" . $percent, "customTitle_AniHPBarText_HP " . $hp . " / " . $maxHp);
```

Use with:

- `references/local-utils/json-ui-utils/title_progress_utils.json`
- `examples/tasks/02-build-title-hp-bar.md`

## Chat-driven topbar

```php
$player->sendMessage("!topbar:textures/ui/bang_icon;Server restart in 5 minutes");
```

Use with:

- `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json`
- `references/local-utils/json-ui-utils/topbar_chat_notification_hud_patch.json`
- `references/local-utils/json-ui-utils/topbar_chat_notification_chat_screen_patch.json`

## Form title routing

```php
$form->setTitle("form:shop:main");
```

Use with:

- `server_form.json`
- title-prefix routing patterns

## Rule

Keep protocol prefixes explicit and unique per system.

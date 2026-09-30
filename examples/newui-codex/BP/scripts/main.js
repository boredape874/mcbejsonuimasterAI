import { world, system, ItemStack, CommandPermissionLevel, CustomCommandStatus } from '@minecraft/server';
import { BOOK_TYPE, createCodexController } from './controller.js';
import { ADDON_VERSION } from './catalog.js';

const controller = createCodexController({ world, system, makeItem: typeId => new ItemStack(typeId, 1) });
const playerSource = origin => origin.sourceEntity?.typeId === 'minecraft:player' ? origin.sourceEntity : undefined;

system.beforeEvents.startup.subscribe(event => {
  event.itemComponentRegistry.registerCustomComponent('newui:open_codex', {
    onUse({ source, itemStack }) { if (itemStack?.typeId === BOOK_TYPE) controller.queueOpen(source); },
    onUseOn({ source, itemStack }) { if (itemStack?.typeId === BOOK_TYPE) controller.queueOpen(source); },
  });
  event.customCommandRegistry.registerCommand({ name: 'newui:open', description: '작은 세계 탐험 도감 열기', permissionLevel: CommandPermissionLevel.Any, cheatsRequired: false }, origin => {
    const player = playerSource(origin);
    if (!player) return { status: CustomCommandStatus.Failure, message: '플레이어가 직접 실행해 주세요.' };
    if (!controller.queueOpen(player, { notifyRejected: false, diagnostic: true })) return { status: CustomCommandStatus.Failure, message: `[NewUI ${ADDON_VERSION}] 요청을 접수하지 못했어요. 이미 처리 중이거나 플레이어 상태를 확인할 수 없어요.` };
    return { status: CustomCommandStatus.Success, message: `[NewUI ${ADDON_VERSION}] 도감 열기 요청을 접수했어요.` };
  });
  event.customCommandRegistry.registerCommand({ name: 'newui:book', description: '빈 가방 칸에 탐험 도감 받기', permissionLevel: CommandPermissionLevel.Any, cheatsRequired: false }, origin => {
    const player = playerSource(origin);
    if (!player) return { status: CustomCommandStatus.Failure, message: '플레이어가 직접 실행해 주세요.' };
    if (!controller.queueBook(player, { notifyRejected: false })) return { status: CustomCommandStatus.Failure, message: `[NewUI ${ADDON_VERSION}] 요청을 접수하지 못했어요. 이미 처리 중이거나 플레이어 상태를 확인할 수 없어요.` };
    return { status: CustomCommandStatus.Success, message: `[NewUI ${ADDON_VERSION}] 도감 지급 요청을 접수했어요.` };
  });
  console.warn(`[NewUI ${ADDON_VERSION}] startup transport=embedded-nbt scriptApi=2.1.0 commands=registered`);
});

system.afterEvents.scriptEventReceive.subscribe(event => controller.handleScriptEvent(event), { namespaces: ['newui'] });
world.afterEvents.playerLeave.subscribe(event => controller.endPlayer(event.playerId));
world.afterEvents.playerSpawn.subscribe(event => controller.endPlayer(event.player.id));
world.afterEvents.playerDimensionChange.subscribe(event => controller.endPlayer(event.player.id));
world.afterEvents.entityDie.subscribe(event => { if (event.deadEntity.typeId === 'minecraft:player') controller.endPlayer(event.deadEntity.id); });
system.run(() => controller.sweep());
system.runInterval(() => controller.sweep(), 100);

/** Composition root. Constructs Host and may open the panel origin. @module @mohou/shell */

export const packageId = '@mohou/shell' as const

export { bootHost, resolveAuthorSkillSource, shellSeed } from './boot.ts'
export { resolvePortConflict, type PortConflictDecision, type PortConflictMode } from './port-conflict.ts'
export { hostRestartExitCode } from './restart-code.ts'
export { applyHostEvent, createFrameBridge, type FrameBridge, type FramePoster, type PanelBridge } from './bridge.ts'
export { watchHost } from './watch.ts'
export { ownerClients, type OwnerPolicy, type OwnerPolicyWrite } from './clients.ts'
export { aboutVersions } from './about.ts'
export { openPanelWindow, panelWindowCommand, type WindowSpawn } from './window.ts'

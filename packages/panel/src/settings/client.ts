/** Public host policy the settings form can read. No secrets. */
export interface PanelPolicy {
  readonly theme: 'system' | 'light' | 'dark'
  readonly palette: string
  readonly locale: string
  readonly chatLanguage: string
  readonly hostPort: number
  readonly llm: { readonly provider: string; readonly model: string } | null
  readonly runtimeProvider: { readonly id: string }
  readonly defaultWorkbenchId?: string
}

export interface PanelPolicyWrite {
  readonly policy: PanelPolicy
  readonly restartRequired: boolean
}

export interface PanelProbe {
  readonly healthy: boolean
  readonly code?: string
  readonly message?: string
}

/** Writing skill install status for one assistant or custom folder. */
export interface PanelSkillCopy {
  readonly dest: string
  readonly installed: boolean
  readonly version: string | null
  readonly updateAvailable: boolean
}

export interface PanelSkillAgent extends PanelSkillCopy {
  readonly id: string
  readonly label: string
  readonly skillsDir: string
  readonly homePresent: boolean
}

export interface PanelSkillStatus {
  readonly skillId: string
  readonly version: string | null
  readonly agents: readonly PanelSkillAgent[]
  readonly customs: readonly (PanelSkillCopy & { readonly dir: string })[]
}

/** Authoring MCP install status for one assistant. */
export interface PanelAuthorMcpAgent {
  readonly id: string
  readonly label: string
  readonly dest: string
  readonly homePresent: boolean
  readonly installed: boolean
  readonly updateAvailable: boolean
}

export interface PanelAuthorMcpStatus {
  readonly agents: readonly PanelAuthorMcpAgent[]
}

/** Owner about block, including the authoring MCP snippet. */
export interface PanelAbout {
  readonly name: string
  readonly current: string
  readonly platform: string
  readonly authoring: {
    readonly url: string
    readonly token: string
    readonly tools: readonly { readonly name: string; readonly description: string }[]
  }
}

/** One registry check. `latest` is missing when the registry did not answer. */
export interface PanelUpdateCheck {
  readonly name: string
  readonly current: string
  readonly latest: string | null
  readonly updateAvailable: boolean
  readonly error?: string
}

/** One registered brain and the vendor/model pairs it publishes. */
export interface PanelRuntime {
  readonly id: string
  readonly label?: string
  readonly models: readonly { readonly provider: string; readonly models: readonly string[] }[]
}

/** Settings calls. Absent means the settings entry is hidden. No route string lives here. */
export interface PanelSettingsClient {
  readPolicy(): Promise<PanelPolicy>
  writePolicy(policy: PanelPolicy): Promise<PanelPolicyWrite>
  probe(id: string): Promise<PanelProbe>
  readAbout?(): Promise<PanelAbout>
  checkUpdate?(): Promise<PanelUpdateCheck>
  restartHost?(): Promise<void>
  listRuntimes?(): Promise<readonly PanelRuntime[]>
  readSkill?(customDirs?: readonly string[]): Promise<PanelSkillStatus>
  installSkill?(agentIds: readonly string[], customDirs: readonly string[]): Promise<PanelSkillStatus>
  revealSkill?(dest: string): Promise<void>
  readAuthorMcp?(): Promise<PanelAuthorMcpStatus>
  installAuthorMcp?(agentIds: readonly string[], description: string): Promise<PanelAuthorMcpStatus>
  revealAuthorMcp?(dest: string): Promise<void>
  listMcp?(): Promise<readonly McpServerDraft[]>
  writeMcp?(servers: readonly McpServerDraft[]): Promise<void>
  checkMcp?(server: McpServerDraft): Promise<McpCheckResult>
  admitMcp?(text: string): Promise<readonly McpServerDraft[]>
  importMcp?(source: string): Promise<readonly McpServerDraft[]>
}

/** One MCP server the settings section can edit. */
export interface McpServerDraft {
  readonly id: string
  readonly description?: string
  readonly enabled?: boolean
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly transport?: 'sse' | 'streamable-http'
  readonly headers?: Readonly<Record<string, string>>
}

/** Result of trying one server without saving. */
export interface McpCheckResult {
  readonly ok: boolean
  readonly tools: readonly { readonly name: string; readonly description?: string }[]
  readonly code?: string
  readonly message?: string
}

/** Storage summary the browse view can show. No route string lives here. */
export interface StorageSummary {
  readonly bytes: number
  readonly tables: readonly string[]
}

export interface StorageTable {
  readonly rows: readonly unknown[]
}

/** Storage reads. Absent means the control is hidden. */
export interface StorageClient {
  readStorage(appId: string): Promise<StorageSummary>
  readTable(appId: string, table: string): Promise<StorageTable>
  restoreStorage?(appId: string): Promise<void>
}

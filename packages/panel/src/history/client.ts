/** One commit the history view can list. No route string lives here. */
export interface HistoryCommit {
  readonly id: string
  readonly message: string
  readonly time: string
  readonly parentIds: readonly string[]
}

export interface HistoryFile {
  readonly path: string
  readonly add: number
  readonly del: number
  readonly preview: string
}

export interface HistoryDetail {
  readonly message: string
  readonly time: string
  readonly parentIds: readonly string[]
  readonly files: readonly HistoryFile[]
}

/** History reads. Absent means the control is hidden. */
export interface HistoryClient {
  readHistory(appId: string): Promise<readonly HistoryCommit[]>
  readCommit(appId: string, commitId: string): Promise<HistoryDetail>
}

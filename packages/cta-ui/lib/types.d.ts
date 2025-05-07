export type Registry = {
  starters: Array<{
    name: string
    description: string
    url: string
    banner?: string
  }>
  'add-ons': Array<{
    name: string
    description: string
    url: string
  }>
}

export type DryRunOutput = {
  files: Record<string, string>
  commands: Array<{
    command: string
    args: Array<string>
  }>
  deletedFiles: Array<string>
}

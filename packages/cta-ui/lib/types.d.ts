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

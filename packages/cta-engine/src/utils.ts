export function sortObject(
  obj: Record<string, string>,
): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

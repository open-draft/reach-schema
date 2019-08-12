export default function getNestedProperty<I, O = any>(
  paths: string[],
  obj: I,
): O {
  let value = obj as any
  let index = 0

  while (index < paths.length) {
    if (value === null) {
      return
    }

    value = value[paths[index]]
    index += 1
  }

  return value
}

/**
 * Returns a nested property value based on the given property path.
 */
export default function getNestedProperty<Input, Output = any>(
  path: string[],
  obj: Input,
): Output {
  let value = obj as any
  let index = 0

  while (index < path.length) {
    if (value === null) {
      return
    }

    value = value[path[index]]
    index += 1
  }

  return value
}

export default function invariant(truthy: boolean, message: string): void {
  if (!truthy) {
    throw new Error(message)
  }
}

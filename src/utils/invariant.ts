const invariant = (truthy: boolean, message: string): void => {
  if (!truthy) {
    throw new Error(message)
  }
}

export default invariant

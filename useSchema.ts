interface Schema {
  [key: string]: Resolver | Schema
}

type Pointer = string[]

interface Resolver {
  (value: any): boolean
}

interface ValidationError {
  pointer: Pointer
  errorType: 'missing' | 'invalid'
}

function useSchema(schema: Schema, obj: Object) {
  const errors = getErrorsBySchema(schema, obj, [])
  return { errors }
}

function getErrorsBySchema(schema: Schema, obj: Object, pointer: Pointer) {
  return Object.keys(schema).reduce<ValidationError[]>((errors, key) => {
    const currentPointer = pointer.concat(key)

    if (typeof obj === 'undefined' || obj === null) {
      return errors.concat(createValidationError(currentPointer, obj))
    }

    const value = obj[key]
    const resolver = schema[key]

    if (typeof resolver === 'object') {
      return errors.concat(getErrorsBySchema(resolver, value, currentPointer))
    }

    const isValid = resolver(value)

    return isValid
      ? errors
      : errors.concat(createValidationError(currentPointer, value))
  }, [])
}

function createValidationError(pointer: Pointer, value: any): ValidationError {
  const errorType = !!value ? 'invalid' : 'missing'

  return {
    pointer,
    errorType,
  }
}

export default useSchema

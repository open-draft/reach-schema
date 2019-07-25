interface Schema {
  [key: string]: ResolversGroup | Resolver | Schema
}

type Pointer = string[]

interface Resolver {
  (value: any, pointer: Pointer): Record<string, boolean> | boolean
}

type ResolversGroup = Record<string, Resolver>

enum ErrorType {
  missing = 'missing',
  invalid = 'invalid',
}

interface ValidationError {
  pointer: Pointer
  errorType: ErrorType
  ruleName: string
}

/**
 * Applies a validation schema to the given Object.
 * Returns validation result.
 */
function useSchema(schema: Schema, obj: Object) {
  return {
    errors: getErrorsBySchema(schema, obj, []),
  }
}

/**
 * Recursively produces the list of validation errors
 * based on the given schema and data.
 */
function getErrorsBySchema(schema: Schema, data: Object, pointer: Pointer) {
  return Object.keys(schema).reduce<ValidationError[]>((errors, key) => {
    const currentPointer = pointer.concat(key)

    // Handle values that are expected by schema, but not defined in data.
    if (typeof data === 'undefined' || data === null) {
      return errors.concat(createValidationError(currentPointer, data))
    }

    const value = data[key]
    const resolver = schema[key]

    if (typeof resolver === 'object') {
      return errors.concat(getErrorsBySchema(resolver, value, currentPointer))
    }

    const resolverOutput = resolver(value, currentPointer)

    if (typeof resolverOutput === 'object') {
      const namedErrors = Object.keys(resolverOutput)
        .filter((ruleName) => !resolverOutput[ruleName])
        .reduce((acc, ruleName) => {
          return acc.concat(
            createValidationError(currentPointer, value, ruleName),
          )
        }, [])
      return errors.concat(namedErrors)
    }

    return resolverOutput
      ? errors
      : errors.concat(createValidationError(currentPointer, value))
  }, [])
}

function createValidationError(
  pointer: Pointer,
  value: any,
  ruleName: string = null,
): ValidationError {
  const errorType = !!value ? ErrorType.invalid : ErrorType.missing

  return {
    pointer,
    errorType,
    ruleName,
  }
}

export default useSchema

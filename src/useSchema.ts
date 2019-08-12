import getNestedProperty from './utils/getNestedProperty'

interface Schema {
  [key: string]: SchemaValue
}

type SchemaValue = ResolversGroup | Resolver | Schema

type Pointer = string[]

interface Resolver {
  (value: any, pointer: Pointer): Record<string, boolean> | boolean
}

type ResolversGroup = Record<string, Resolver>

export enum ErrorStatus {
  missing = 'missing',
  invalid = 'invalid',
}

export interface ValidationError {
  pointer: Pointer
  value: any
  status: ErrorStatus
  rule: string
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
    if (data == null) {
      return errors.concat(createValidationError(currentPointer, data))
    }

    const value = data[key]
    const resolverPayload = schema[key]

    // When a resolver function returns an Array,
    // treat the first argument as a predicate that determines if validation is necessary.
    // Threat the second argument as the resolver function.
    const [predicate, resolver] = Array.isArray(resolverPayload)
      ? resolverPayload
      : [() => true, resolverPayload]
    const shouldValidate = predicate(value, key, currentPointer, data, schema)

    if (!shouldValidate) {
      return errors
    }

    if (typeof resolver === 'object') {
      return errors.concat(getErrorsBySchema(resolver, value, currentPointer))
    }

    const resolverVerdict = resolver(value, currentPointer)

    // If resolver returns an Object, treat it as named rules map.
    if (typeof resolverVerdict === 'object') {
      const namedErrors = Object.keys(resolverVerdict)
        // Note that named resolvers keep a boolean value,
        // not the verdict function. Therefore, no calls.
        .filter((rule) => !resolverVerdict[rule])
        .reduce((acc, rule) => {
          return acc.concat(createValidationError(currentPointer, value, rule))
        }, [])
      return errors.concat(namedErrors)
    }

    // Otherwise resolver is a function that returns a boolean verdict
    return resolverVerdict
      ? errors
      : errors.concat(createValidationError(currentPointer, value))
  }, [])
}

function createValidationError(
  pointer: Pointer,
  value: any = null,
  rule: string = null,
): ValidationError {
  const status = !!value ? ErrorStatus.invalid : ErrorStatus.missing

  return {
    pointer,
    value,
    status,
    rule,
  }
}

/**
 * High-order resolver that applies a given resolver function
 * only when the associated property is present in the actual data.
 */
export const optional = (payload: SchemaValue) => {
  return [
    (value, key, pointer, data, schema) => {
      return getNestedProperty(pointer, data) != null
    },
    payload,
  ]
}

export default useSchema

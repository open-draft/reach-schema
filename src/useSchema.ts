import invariant from './utils/invariant'
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
  status: ErrorStatus
  value?: any
  rule?: string
}

/**
 * Applies a validation schema to the given Object.
 * Returns validation result.
 */
function useSchema(schema: Schema, data: Object) {
  const schemaType = Object.prototype.toString.call(schema)
  invariant(
    schemaType.includes('Object'),
    `Invalid schema: expected schema to be an Object, but got ${schemaType}.`,
  )

  const dataType = Object.prototype.toString.call(data)
  invariant(
    dataType.includes('Object'),
    `Invalid data: expected actual data to be an Object, but got ${dataType}.`,
  )

  return {
    errors: getErrorsBySchema(schema, data, []),
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
    const resolverType = typeof resolver
    const shouldValidate = predicate(value, key, currentPointer, data, schema)

    if (!shouldValidate) {
      return errors
    }

    if (resolverType === 'object') {
      // Recursive case.
      // An Object resolver value is treated as a nested validation schema.
      return errors.concat(getErrorsBySchema(resolver, value, currentPointer))
    }

    invariant(
      resolverType === 'function',
      `Invalid schema at "${currentPointer.join(
        '.',
      )}": expected resolver to be a function, but got ${resolverType}.`,
    )

    const resolverVerdict = resolver(value, currentPointer)

    // If resolver returns an Object, treat it as named rules map.
    if (typeof resolverVerdict === 'object') {
      const namedErrors = Object.keys(resolverVerdict)
        // Note that named resolvers keep a boolean value,
        // not the verdict function. Therefore, no calls.
        .filter((ruleName) => {
          const ruleVerdict = resolverVerdict[ruleName]

          invariant(
            typeof ruleVerdict === 'boolean',
            `Invalid schema at "${currentPointer
              .concat(ruleName)
              .join(
                '.',
              )}": expected named resolver to be a boolean, but got ${typeof ruleVerdict}.`,
          )

          return !ruleVerdict
        })
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
  value?: any,
  rule?: string,
): ValidationError {
  const status = !!value ? ErrorStatus.invalid : ErrorStatus.missing

  const error: ValidationError = {
    pointer,
    status,
  }

  if (value) {
    error.value = value
  }

  if (rule) {
    error.rule = rule
  }

  return error
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

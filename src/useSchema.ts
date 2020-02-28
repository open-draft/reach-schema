import invariant from './utils/invariant'
import getNestedProperty from './utils/getNestedProperty'

type UnknownData = Record<string, any>

type Schema<Data = UnknownData> = {
  [K in keyof Data]?: ResolverOrNestedSchema<Data[K], Data>
}

type ResolverPredicate<ValueType, DataType> = (
  value: ValueType,
  key: string,
  pointer: Pointer,
  data: DataType,
  schema: Schema<ValueType>,
) => boolean

type ConditionalResolver<ValueType, DataType> = [
  ResolverPredicate<ValueType, DataType>,
  ResolverOrNestedSchema<ValueType, DataType>,
]

type ResolverOrNestedSchema<ValueType, DataType> =
  | Resolver<ValueType>
  | ConditionalResolver<ValueType, DataType>
  | Schema<ValueType>

type Pointer = string[]

type Resolver<ValueType> = (
  value: ValueType,
  pointer: Pointer,
) => Record<string, boolean> | boolean

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
 * Validates data against the given schema.
 */
export const useSchema = <Data extends Record<string, any> = any>(
  schema: Schema<Data>,
  data: Data,
) => {
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
    errors: getErrorsBySchema<Data>(schema, data, []),
  }
}

/**
 * Recursively produces a list of validation errors
 * based on the given schema and data.
 */
function getErrorsBySchema<Data>(
  schema: Schema<Data>,
  data: Data,
  pointer: Pointer,
) {
  return Object.keys(schema).reduce<ValidationError[]>((errors, key) => {
    const currentPointer = pointer.concat(key)

    // Handle values that are expected by schema, but not defined in the data
    if (data == null) {
      return errors.concat(createValidationError(currentPointer, data))
    }

    const value = data[key]
    const resolverPayload: ResolverOrNestedSchema<typeof value, Data> =
      schema[key]

    // When a resolver function returns an Array,
    // treat the first argument as a predicate that determines if validation is necessary.
    // Threat the second argument as the resolver function.
    /**
     * @todo Fix type annotations.
     */
    const [predicate, resolver] = Array.isArray(resolverPayload)
      ? resolverPayload
      : [() => true, resolverPayload]

    if (!predicate(value, key, currentPointer, data, schema)) {
      return errors
    }

    if (typeof resolver === 'object') {
      // Recursive case.
      // An Object resolver value is treated as a nested validation schema.
      return errors.concat(
        getErrorsBySchema(resolver as Schema, value, currentPointer),
      )
    }

    invariant(
      typeof resolver === 'function',
      `Invalid schema at "${currentPointer.join(
        '.',
      )}": expected resolver to be a function, but got ${typeof resolver}.`,
    )

    const resolverVerdict = resolver(value, currentPointer)

    // If resolver returns an Object, treat it as named rules map
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
        .reduce<ValidationError[]>((acc, rule) => {
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
export const optional = <ValueType, DataType>(
  resolver: ResolverOrNestedSchema<ValueType, DataType>,
): ConditionalResolver<ValueType, DataType> => {
  return [
    (value, key, pointer, data, schema) => {
      return getNestedProperty(pointer, data) != null
    },
    resolver,
  ]
}

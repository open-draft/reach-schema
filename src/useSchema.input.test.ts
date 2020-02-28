import { useSchema } from './useSchema'

/**
 * @todo Tests fail:
 * src/useSchema.ts:7:23 - error TS2315: Type 'ResolverOrNestedSchema' is not generic.
 *
 * And a bunch of similar "not generic" errors.
 */

describe('useSchema: Input validation', () => {
  describe('given invalid schema', () => {
    const invalidSchemas = [2, 'schema', [], null, undefined]

    invalidSchemas.forEach((schema) => {
      const schemaType = Object.prototype.toString.call(schema)

      describe(`given ${schemaType} as schema`, () => {
        const validate = () => useSchema(schema as any, {})

        it('should throw error about invalid schema value', () => {
          expect(validate).toThrow(
            `Invalid schema: expected schema to be an Object, but got ${schemaType}.`,
          )
        })
      })
    })
  })

  describe('given invalid data', () => {
    const invalidData = [2, 'data', [], null, undefined]

    invalidData.forEach((data) => {
      const dataType = Object.prototype.toString.call(data)

      describe(`given ${dataType} as data`, () => {
        const validate = () => useSchema({}, data as any)

        it('should throw error about invalid data', () => {
          expect(validate).toThrow(
            `Invalid data: expected actual data to be an Object, but got ${dataType}`,
          )
        })
      })
    })
  })

  describe('given schema with invalid resolver', () => {
    const validate = () =>
      useSchema(
        {
          // @ts-ignore
          lastName: 5,
        },
        {},
      )

    it('should throw an error about invalid resolver', () => {
      expect(validate).toThrow(
        `Invalid schema at "lastName": expected resolver to be a function, but got number.`,
      )
    })
  })

  describe('given schema with invalid named rule', () => {
    const validate = () =>
      useSchema(
        {
          // @ts-ignore
          firstName: (value) => ({
            minLength: 2,
          }),
        },
        { firstName: 'John' },
      )

    it('should throw an error about invalid named resolver', () => {
      expect(validate).toThrow(
        'Invalid schema at "firstName.minLength": expected named resolver to be a boolean, but got number.',
      )
    })
  })
})

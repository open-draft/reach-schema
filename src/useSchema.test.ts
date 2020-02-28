import { Schema, useSchema, optional } from './useSchema'

const withSchema = <Data>(schema: Schema<Data>) => (data: Data) => {
  return useSchema<Data>(schema, data)
}

describe('useSchema', () => {
  describe('given one-line resolver', () => {
    const withData = withSchema<{ firstName?: string; lastName?: string }>({
      firstName: (value) => value === 'john',
    })

    describe('and actual data matches', () => {
      const result = withData({
        firstName: 'john',
      })

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('and a key is missing in the actual data', () => {
      const result = withData({
        lastName: 'locke',
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        it('should have a pointer to the property', () => {
          expect(result.errors[0]).toHaveProperty('pointer', ['firstName'])
        })

        it('should not have a value', () => {
          expect(result.errors[0]).not.toHaveProperty('value')
        })

        it('should have "missing" status', () => {
          expect(result.errors[0]).toHaveProperty('status', 'missing')
        })

        it('should not have a rule', () => {
          expect(result.errors[0]).not.toHaveProperty('rule')
        })
      })
    })

    describe('and actual data rejects', () => {
      const result = withData({
        firstName: 'martin',
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        it('should have a pointer to the property', () => {
          expect(result.errors[0]).toHaveProperty('pointer', ['firstName'])
        })

        it('should have a value of the property', () => {
          expect(result.errors[0]).toHaveProperty('value', 'martin')
        })

        it('should have "invalid" status', () => {
          expect(result.errors[0]).toHaveProperty('status', 'invalid')
        })

        it('should not have a rule', () => {
          expect(result.errors[0]).not.toHaveProperty('rule')
        })
      })
    })
  })

  describe('given a resolver with 3 named rules', () => {
    const withData = withSchema<{ password: string }>({
      password: (value) => ({
        minLength: value.length > 5,
        capitalLetter: /[A-Z]/.test(value),
        oneNumber: /[0-9]/.test(value),
      }),
    })

    describe('and actual data matches all rules', () => {
      const result = withData({
        password: 'PassWord1',
      })

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('and actual data rejects 2 rules', () => {
      const result = withData({
        password: 'long value',
      })

      it('should return error for each rejected rule', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(2)
      })

      describe('each error', () => {
        it('should have a pointer to the property', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('pointer', ['password'])
          })
        })

        it('should have "invalid" status', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('status', 'invalid')
          })
        })

        it('should have a value of the property', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('value', 'long value')
          })
        })

        it('should have a rejected rule name', () => {
          result.errors.forEach((error) => {
            expect(error.rule).toMatch(/capitalLetter|oneNumber/)
          })
        })
      })
    })

    describe('and actual data rejects all rules', () => {
      const result = withData({
        password: 'wrong',
      })

      it('should return error for all rejected rules', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(3)
      })

      describe('each error', () => {
        it('should have a pointer to the property', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('pointer', ['password'])
          })
        })

        it('should have "invalid" status', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('status', 'invalid')
          })
        })

        it('should have a value of the property', () => {
          result.errors.forEach((error) => {
            expect(error).toHaveProperty('value', 'wrong')
          })
        })

        it('should include rejected rule name', () => {
          result.errors.forEach((error) => {
            expect(error.rule).toMatch(/minLength|capitalLetter|oneNumber/)
          })
        })
      })
    })
  })

  describe('given schema with nested properties', () => {
    const withData = withSchema<{
      firstName?: string
      billingDetails?: {
        city?: string
        country?: string
      }
    }>({
      billingDetails: {
        country: (value) => ['uk', 'us'].includes(value),
      },
    })

    describe('and actual data matches', () => {
      const result = withData({
        billingDetails: {
          country: 'us',
        },
      })

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('and a property is missing in the actual data', () => {
      const result = withData({
        billingDetails: {
          city: 'London',
        },
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['billingDetails', 'country'])
        })

        it('should have "missing" status', () => {
          expect(error).toHaveProperty('status', 'missing')
        })

        it('should not have a value', () => {
          expect(error).not.toHaveProperty('value')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })

    describe('and a parent property is missing in the actual data', () => {
      const result = withData({
        firstName: 'john',
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['billingDetails', 'country'])
        })

        it('should have "missing" status', () => {
          expect(error).toHaveProperty('status', 'missing')
        })

        it('should not have a value', () => {
          expect(error).not.toHaveProperty('value')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })

    describe('and actual data is invalid', () => {
      const result = withData({
        billingDetails: {
          country: 'it',
        },
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['billingDetails', 'country'])
        })

        it('should have "invalid" status', () => {
          expect(error).toHaveProperty('status', 'invalid')
        })

        it('should have a value of the property', () => {
          expect(error).toHaveProperty('value', 'it')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })
  })

  describe('given schema with an optional property', () => {
    const withData = withSchema<{ firstName: string }>({
      firstName: optional((value) => value.length > 1),
    })

    describe('and an optional property is missing', () => {
      const result = withData({} as any)

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('and optional property resolves', () => {
      const result = withData({
        firstName: 'John',
      })

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('and optional property rejects', () => {
      const result = withData({
        firstName: 'J',
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['firstName'])
        })

        it('should have "invalid" status', () => {
          expect(error).toHaveProperty('status', 'invalid')
        })

        it('should have a value of the property', () => {
          expect(error).toHaveProperty('value', 'J')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })
  })

  describe('given schema with an optional property that includes required keys', () => {
    const withData = withSchema<{
      billingDetails: {
        firstName?: string
        country?: string
      }
    }>({
      billingDetails: optional({
        country: (value) => ['uk', 'us'].includes(value),
      }),
    })

    describe('and optional property is missing', () => {
      const result = withData({} as any)

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('and optional property resolves', () => {
      const result = withData({
        billingDetails: {
          country: 'uk',
        },
      })

      it('should not return errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('and optional property is present, but its required child is missing', () => {
      const result = withData({
        billingDetails: {
          firstName: 'John',
        },
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['billingDetails', 'country'])
        })

        it('should have "missing" status', () => {
          expect(error).toHaveProperty('status', 'missing')
        })

        it('should not have a value', () => {
          expect(error).not.toHaveProperty('value')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })

    describe('and optional property pointer is present, but invalid', () => {
      const result = withData({
        billingDetails: {
          country: 'es',
        },
      })

      it('should return one error', () => {
        expect(result).toHaveProperty('errors')
        expect(result.errors).toHaveLength(1)
      })

      describe('the returned error', () => {
        const [error] = result.errors

        it('should have a pointer to the property', () => {
          expect(error).toHaveProperty('pointer', ['billingDetails', 'country'])
        })

        it('should have "invalid" status', () => {
          expect(error).toHaveProperty('status', 'invalid')
        })

        it('should have a value of the property', () => {
          expect(error).toHaveProperty('value', 'es')
        })

        it('should not have a rule', () => {
          expect(error).not.toHaveProperty('rule')
        })
      })
    })
  })
})

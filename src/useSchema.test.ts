import useSchema, { optional } from './useSchema'

const withSchema = (schema) => (data) => {
  return useSchema(schema, data)
}

describe('useSchema', () => {
  describe('using one-line resolver', () => {
    const withData = withSchema({
      firstName: (value) => value === 'john',
    })

    describe('given a matching key', () => {
      const result = withData({
        firstName: 'john',
      })

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given a key is missing', () => {
      const result = withData({
        lastName: 'locke',
      })

      it('should return a missing error', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['firstName'],
            value: null,
            status: 'missing',
            rule: null,
          },
        ])
      })
    })

    describe('given a non-matching key', () => {
      const result = withData({
        firstName: 'martin',
      })

      it('should return an invalid error', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['firstName'],
            value: 'martin',
            status: 'invalid',
            rule: null,
          },
        ])
      })
    })
  })

  describe('given a resolver with multiple rules', () => {
    const withData = withSchema({
      password: (value) => ({
        minLength: value.length > 5,
        capitalLetter: /[A-Z]/.test(value),
        oneNumber: /[0-9]/.test(value),
      }),
    })

    describe('given a key matches all rules', () => {
      const result = withData({
        password: 'PassWord1',
      })

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given a key rejects several rules', () => {
      const result = withData({
        password: 'long value',
      })

      it('should return error for each rejected rule', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['password'],
            value: 'long value',
            status: 'invalid',
            rule: 'capitalLetter',
          },
          {
            pointer: ['password'],
            value: 'long value',
            status: 'invalid',
            rule: 'oneNumber',
          },
        ])
      })
    })

    describe('given a key rejects all rules', () => {
      const result = withData({
        password: 'wrong',
      })

      it('should return errors for all rules', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['password'],
            value: 'wrong',
            status: 'invalid',
            rule: 'minLength',
          },
          {
            pointer: ['password'],
            value: 'wrong',
            status: 'invalid',
            rule: 'capitalLetter',
          },
          {
            pointer: ['password'],
            value: 'wrong',
            status: 'invalid',
            rule: 'oneNumber',
          },
        ])
      })
    })
  })

  describe('given schema with nested keys', () => {
    const withData = withSchema({
      billingDetails: {
        country: (value) => ['uk', 'us'].includes(value),
      },
    })

    describe('given a key matches', () => {
      const result = withData({
        billingDetails: {
          country: 'us',
        },
      })

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given a key is missing', () => {
      const result = withData({
        billingDetails: {
          city: 'London',
        },
      })

      it('should return a missing error', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['billingDetails', 'country'],
            value: null,
            status: 'missing',
            rule: null,
          },
        ])
      })
    })

    describe('given a parent key is missing', () => {
      const result = withData({
        firstName: 'john',
      })

      it('should return a parent missing error', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['billingDetails', 'country'],
            value: null,
            status: 'missing',
            rule: null,
          },
        ])
      })
    })

    describe('given a key is invalid', () => {
      const result = withData({
        billingDetails: {
          country: 'it',
        },
      })

      it('should return an invalid key error', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['billingDetails', 'country'],
            value: 'it',
            status: 'invalid',
            rule: null,
          },
        ])
      })
    })
  })

  describe('given schema with an optional key', () => {
    const withData = withSchema({
      firstName: optional((value) => value.length > 1),
    })

    describe('given an optional key is missing', () => {
      const result = withData({})

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given optional key resolves', () => {
      const result = withData({
        firstName: 'John',
      })

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given optional key rejects', () => {
      const result = withData({
        firstName: 'J',
      })

      it('should return an error for the optional key', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['firstName'],
            status: 'invalid',
            value: 'J',
            rule: null,
          },
        ])
      })
    })
  })

  describe('given schema with an optional key that includes required keys', () => {
    const withData = withSchema({
      billingDetails: optional({
        country: (value) => ['uk', 'us'].includes(value),
      }),
    })

    describe('given optional key is missing', () => {
      const result = withData({})

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given optional key resolves', () => {
      const result = withData({
        billingDetails: {
          country: 'uk',
        },
      })

      it('should return no errors', () => {
        expect(result).toHaveProperty('errors', [])
      })
    })

    describe('given optional key is present, but its required child is missing', () => {
      const result = withData({
        billingDetails: {
          firstName: 'John',
        },
      })

      it('should return error saying required child is missing', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['billingDetails', 'country'],
            status: 'missing',
            value: null,
            rule: null,
          },
        ])
      })
    })

    describe('given optional key and its required child are present, but invalid', () => {
      const result = withData({
        billingDetails: {
          country: 'es',
        },
      })

      it('should return error saying required child is invalid', () => {
        expect(result).toHaveProperty('errors', [
          {
            pointer: ['billingDetails', 'country'],
            status: 'invalid',
            value: 'es',
            rule: null,
          },
        ])
      })
    })
  })
})

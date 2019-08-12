import useSchema from './useSchema'

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
            value: undefined,
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
            value: undefined,
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
            value: undefined,
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
})

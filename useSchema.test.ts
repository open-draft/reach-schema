import useSchema from './useSchema'

describe('useSchema', () => {
  describe('Shallow schema', () => {
    const result = useSchema(
      {
        firstName: (value) => value === 'john',
        lastName: (value) => value === 'locke',
      },
      {
        firstName: 'john',
      },
    )

    it('returns error for a rejected field', () => {
      expect(result).toHaveProperty('errors', [
        {
          pointer: ['lastName'],
          errorType: 'missing',
        },
      ])
    })
  })

  describe('Nested schema', () => {
    const result = useSchema(
      {
        id: (value) => typeof value === 'number',
        billingAddress: {
          firstName: (value) => !!value,
          country: (value) => ['fi', 'ua'].includes(value),
          location: {
            lat: (value) => value > 0,
            lon: (value) => value > 0,
            server: {
              name: (value) => !!value,
            },
          },
        },
      },
      {
        id: 2,
        billingAddress: {
          street: 'Sunwell ave.',
          country: 'us',
          location: {
            lat: 834,
          },
        },
      },
    )

    it('includes pointer to nested rejected property', () => {
      expect(result).toHaveProperty('errors', [
        {
          pointer: ['billingAddress', 'firstName'],
          errorType: 'missing',
        },
        {
          pointer: ['billingAddress', 'country'],
          errorType: 'invalid',
        },
        {
          pointer: ['billingAddress', 'location', 'lon'],
          errorType: 'missing',
        },
        {
          pointer: ['billingAddress', 'location', 'server', 'name'],
          errorType: 'missing',
        },
      ])
    })
  })
})

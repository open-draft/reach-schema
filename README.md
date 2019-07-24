## Features

- [x] Recursive validation
- [ ] Custom error types / rule names
- [ ] Multiple criteria (rules) toward a single value

## Example

```js
import { useSchema } from 'the-package'

const result = useSchema(
  {
    firstName: (value) => value === 'john',
    lastName: (value) => value === 'locke',
    billingAddress: {
      country: (value) => value.length === 2,
    },
  },
  {
    firstName: 'john',
    billingAddress: {
      country: 'USA',
    },
  },
)
```

The `result` would equal:

```js
{
  errors: [
    {
      pointer: ['lastName'],
      errorType: 'missing',
    },
    {
      pointer: ['billingAddress', 'country'],
      errorType: 'invalid',
    },
  ]
}
```

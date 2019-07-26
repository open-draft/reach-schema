# API

## `useSchema: (schema: Schema, data: Object): ValidationError[]`

### Basic example

Each property in a schema corresponds to such property in the data Object. Each schema value is a _resolver_ function that accepts an actual data value and returns a `Boolean` verdict.

```js
useSchema(
  {
    firstName: (value) => value === 'john',
    lastName: (value) => value === 'locke',
    age: (value) => age > 18,
  },
  {
    firstName: 'john',
    age: 16,
  },
)
```

```json
[
  {
    "pointer": ["lastName"],
    "errorType": "missing"
  },
  {
    "pointer": ["age"],
    "errorType": "invalid"
  }
]
```

### Nested properties

If a schema key equals an Object literal, that nested Object is expected in the data. This allows to validate deeply nested structures.

```js
useSchema(
  {
    billingData: {
      country: (value) => ['UK', 'ES'].includes(value),
    },
  },
  {
    billingData: {
      country: 'US',
    },
  },
)
```

```json
[
  {
    "pointer": ["billingData", "country"],
    "errorType": "invalid"
  }
]
```

### Multiple criteria

A resolver function may also return a `Record<string, boolean>` that describes multiple validation rules applied to a single property. The value must satisfy all the rules to be valid.

```js
useSchema(
  {
    password: (value) => ({
      minLength: value.length > 5,
      capitalLetters: /[A-Z]{2}/.test(value),
      oneNumber: /[0-9]/.test(value),
    }),
  },
  {
    password: 'DeMo',
  },
)
```

```json
[
  {
    "pointer": ["password"],
    "errorType": "invalid",
    "ruleName": "minLength"
  },
  {
    "pointer": ["password"],
    "errorType": "invalid",
    "ruleName": "oneNumber"
  }
]
```

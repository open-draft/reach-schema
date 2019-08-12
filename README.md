<br />

<p align="center">
  <img src="./logo.svg" alt="Reach schema logo" width="200" />
</p>

<br />

<h1 align="center">Reach Schema</h1>
<p align="center">Functional schema-driven JavaScript object validation.</p>

## Motivation

Look up any Object validation library in JavaScript. You are going to find a class-bloated rigid abstraction that handles complexity by introducing even more complexity.

**How I see Object validation instead:**

1. Validation result is a function from schema and data.
1. Validation is not concerned with any logic around error messages.

All these criteria can be summarized as: _validation should be functional_. Functional composition gives you flexibility and power than no class abstractions could ever match.

> It's recommended to use this library alongside any functional utilities library (i.e. [lodash](https://lodash.com/), [ramda](https://ramdajs.com/)). They can save you a lot of time on writing custom resolvers.

## Validation schema

Object validation happens based on the given schema. A validation schema is an Object where each key represents a _required key_ in the data Object. Key value may be one of the following:

1. Resolver function that returns a validity of a data value.
1. Nested schema Object.

## API

### `useSchema: (schema: Schema, data: Object): ValidationError[]`

#### Basic example

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
    "status": "missing"
  },
  {
    "pointer": ["age"],
    "status": "invalid"
  }
]
```

#### Nested properties

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
    "status": "invalid"
  }
]
```

#### Multiple criteria

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
    "status": "invalid",
    "ruleName": "minLength"
  },
  {
    "pointer": ["password"],
    "status": "invalid",
    "ruleName": "oneNumber"
  }
]
```

## Error messages

Validation logic is decoupled from error messages for a number of reasons:

1. **Separation of concerns**. Think of validation logic as a business logic and error messages as a view layer. Those are usually kept separated to have each do its own job and do it well.
1. **Dynamic messages**. Error messages are often consumed by a client and are localized or context-dependent. If separated from the validation logic, they can be derived from the validation errors depending on a locale, or any other condition.

## Recipes

### Key existence

To check that a key exists in the data Object provide it in the validation schema and make its resolver return `true`.

```js
useSchema(
  {
    // The key "email" is required in the data Object,
    // but is always valid, no matter the value.
    email: () => true,
  },
  {
    email: 'admin@example.com',
  },
)
```

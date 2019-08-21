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

Object validation happens based on the given schema. A validation schema is an Object where each key represents such property in the actual data Object. A value of the key may be one of the following:

1. Resolver function that returns a validity of a data value.
1. Nested schema Object.

Applying a schema returns the list of validation errors.

## Errors

Each validation error has this structure:

```ts
interface Error {
  // Pointer to the related property in the actual Object.
  pointer: string[]

  // Field that doesn't match a schema may be in
  // one of the two possible stats:
  // - missing. Expected, but not present in the data.
  // - invalid. Present in both, but not matching the resolver.
  status: 'missing' | 'invalid'

  // (Optional) The actual value of the validated property
  // Present if a property has value.
  value?: any

  // (Optional) Rule name, in case of rejecting named resolver.
  // Present if given a named resolver.
  rule?: string
}
```

## API

### `useSchema: (schema: Schema, data: Object): ValidationError[]`

#### Basic example

Each key in a schema corresponds to such property in the actual data Object. Each schema value is a _resolver_ function that accepts an actual data value and returns a `Boolean` verdict.

```js
import { useSchema } from 'reach-schema'

useSchema(
  {
    firstName: (value) => value === 'john',
    lastName: (value) => value === 'locke',
    age: (value) => value > 18,
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
    "status": "invalid",
    "value": 16
  }
]
```

#### Nested properties

If a schema key equals an Object literal, that nested Object is expected in the data. This allows to validate deeply nested structures.

```js
import { useSchema } from 'reach-schema'

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
    "status": "invalid",
    "value": "US"
  }
]
```

#### Multiple criteria

A resolver function may also return a `Record<string, boolean>` that describes multiple validation rules applied to a single property. The value must satisfy all the rules to be valid. Each resolver corresponding to a validation criteria is called _named resolver_.

```js
import { useSchema } from 'reach-schema'

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
    "value": "DeMo",
    "rule": "minLength"
  },
  {
    "pointer": ["password"],
    "status": "invalid",
    "value": "DeMo",
    "rule": "oneNumber"
  }
]
```

## Error messages

Validation logic is decoupled from error messages for a number of reasons:

1. **Separation of concerns**. Think of validation logic as a business logic and error messages as a view layer. Those are usually kept separated to have each do its own job and do it well.
1. **Dynamic messages**. Error messages are often consumed by a client and are localized or context-dependent. If separated from the validation logic, they can be derived from the validation errors depending on a locale, or any other condition.

## Recipes

### Property existence

To check that a property exists in the data Object provide it in the validation schema and make its resolver always return `true`.

```js
import { useSchema } from 'reach-schema'

useSchema(
  {
    // The property "email" is required in the data Object,
    // but is always valid, no matter the value.
    email: () => true,
  },
  {
    email: 'admin@example.com',
  },
)
```

### Optional properties

Optional, or _week_ validation, is the one applied only when the mentioned property is present in the actual data. This marks such property as optional, but still applies a provided structure or resolver(s) when the property is present.

```js
import { useSchema, optional } from 'reach-schema'

useSchema(
  {
    firstName: optional((value) => value.length > 1),
    billingData: optional({
      address: (value) => value.includes('st.'),
      firstName: optional((value) => value.length > 1),
    }),
  },
  {
    billingData: {
      address: 'Invalid address',
    },
  },
)
```

```json
[
  {
    "pointer": ["billingData", "address"],
    "status": "invalid",
    "value": "Invalid address"
  }
]
```

> Note that `firstName` and `billingAddress.firstName` are missing in the actual data, but that produces no errors, because both properties are optional.

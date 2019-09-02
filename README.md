<br />

<p align="center">
  <img src="./logo.svg" alt="Reach schema logo" width="200" />
</p>

<br />

<h1 align="center">Reach Schema</h1>
<p align="center">Functional schema-driven JavaScript object validation library.</p>

## Motivation

If you are to look up any Object validation library in JavaScript you would find a class-bloated rigid abstraction that handles complexity by introducing even more complexity. I believe that doesn't have to be that way.

**This is how I envision Object validation:**

1. Validation result is a function from schema and data.
1. Validation result is not coupled with the error messages logic.

In other words, _validation should be functional_. Functional composition gives you flexibility and power than no class abstractions can match.

> Reach Schema can be used alongside other functional libraries (i.e. [lodash](https://lodash.com/), [ramda](https://ramdajs.com/)). They can be useful when writing validation resolvers or composing a validation schema.

## Validation schema

Object validation happens based on the validation schema.

```ts
interface Schema {
  [field: string]: Resolver | NamedResolver | Schema
}

// A plain resolver function that returns a boolean verdict.
interface Resolver<ValueType> {
  (value: ValueType): boolean
}

// A named resolver function that returns a Record of rules.
interface NamedResolver<ValueType> {
  (value: ValueType): {
    [ruleName: string]: boolean
  }
}
```

Applying a validation schema to the actual data returns the validation result.

```ts
interface ValidationResult {
  errors: Error[]
}
```

## Errors

Each validation error has the following structure:

```ts
interface Error {
  // Pointer to the related property in the actual data.
  pointer: string[]

  // A property's validation state.
  // - "missing". Expected, but not present in the actual data.
  // - "invalid". Present, but doesn't satisfy the validation resolver.
  status: 'missing' | 'invalid'

  // A property's value, if present in the actual data.
  value?: any

  // Name of the rejected validation rule, if applicable.
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

Validation logic is decoupled from the error messages for a number of reasons:

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

Optional (_weak_) validation is applied only when the mentioned property is present in the actual data. This marks such property as optional, but still applies a validation resolver when the property is provided.

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
      firstName: 'J',
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
  },
  {
    "pointer": ["billingData", "firstName"],
    "status": "invalid",
    "value": "J"
  }
]
```

> Note that root-level `firstName` property is missing in the actual data, but that is not considered invalid, as the property is marked as `optional`.

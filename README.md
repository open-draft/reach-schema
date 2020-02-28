<br />

<p align="center">
  <img src="./logo.svg" alt="Reach schema logo" width="200" />
</p>

<br />

<h1 align="center">Reach Schema</h1>
<p align="center">Functional schema-driven JavaScript object validation library.</p>

## Motivation

It happens that JavaScript Object validation libraries are often class-based and operate using via a chain of operators. With Reach Schema I would like to take an alternative approach, making validation functional.

**Main concepts of React Schema:**

1. Validation result is a function from schema and data.
1. Validation result is not coupled with the error messages logic.

> Reach Schema works great together with functional programming libraries like [lodash](https://lodash.com/) or [ramda](https://ramdajs.com/). They allow to make validation declaration shorter and make your life easier. Consider those.

## Validation schema

Data validity is described using a _validation schema_. It's a plain Object which keys represent the actual data keys hierarhcy, and values equal to _resolver functions_ that return the validation verdict.

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

## Resolver

_Resolver_ is a function that determines a value's validity. A simple resolver accepts a value and returns a boolean verdict. Reach Schema supports more complex resolvers, such as _grouped resolver_, which allows to provide multiple independent criteria to a single value.

### Basic resolver

```js
useSchema(
  {
    firstName: (value, pointer) => value === 'John',
  },
  {
    firstName: 'Jessica',
  },
)
```

### Grouped resolver

```js
useSchema(
  {
    password: (value, pointer) => ({
      minLength: value.length > 7,
      capitalLetter: /[A-Z]/.test(value),
      oneNumber: /[0-9]/.test(value),
    }),
  },
  {
    password: 'IshallPass8',
  },
)
```

### Nested schema

Resolver may also return an Object, if validating an Object type value, which would be treated as a nested [Validation schema](#validation-schema).

```js
useSchema(
  {
    billingDetails: {
      // Nested schema accepts all kinds of resolvers:
      // basic, grouped, and deeply nested schema.
      address: (value) => checkAddressExistance(value),
      zipCode: (value) => /\d{5}/.test(zipCode),
    },
  },
  {
    billingDetails: {
      address: 'Sunwell Ave.',
      zipCode: 56200,
    },
  },
)
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

Each key in a schema corresponds to same property in the actual data. Each schema value is a _resolver_ function that accepts an actual data value and returns a `Boolean` verdict.

```js
import { useSchema } from 'reach-schema'

useSchema(
  {
    firstName: (value) => value === 'john',
    lastName: (value) => value === 'locke',
    age: (value) => value > 17,
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

A resolver function may also return a map of rules that apply to the corresponding nested properties. By default, the actual value must satisfy all the rules in order to be valid (**see [Optional validation](#optional-validation)**). Each resolver corresponding to a validation criteria is called _named resolver_.

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

Reach Schema does not provide any error messages directly. Instead, it treats an error message as an artifact derived from the validation result. To achieve that it provides all the relevant information in the validation result to construct an error message.

However, there is a common logic that can be integrated into such error messages construction (i.e. resolving due to priority, fallback messages). Declaring such logic each time would be lengthy, time-consuming, and prone to human error.

## Recipes

### Property existence

To check that a property exists in the actual data provide a resolver function that always returns `true`. Ideologically it marks the property as "always valid", but since the default validation behavior asserts all the keys present in the Validation Schema, it also implies that the property must be present.

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

### Optional validation

To apply an optional (_weak_) validation to a property wrap its resolver in the `optional` helper function. This way the property's value will be validated only if present in the actual data. If the property is missing in the actual data it's never validated and considered as valid.

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

### Usage with TypeScript

`useSchema` will infer the type of the given data automatically. However, to type guard the data itself it's useful to describe the data separately and provide to schema:

```ts
interface UserDetails {
  firstName: string
  lastName: string
  age: number
}

useSchema<UserDetails>(
  {
    firstName: (value) => value.length > 2,
    lastName: (value) => value.length > 2,
    age: (value) => value > 17,
  },
  {
    firstName: 'John',
    lastName: 'Maverick',
    age: 31,
  },
)
```

# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `mech-prep-app-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListUserMistakes*](#listusermistakes)
- [**Mutations**](#mutations)
  - [*UpsertMistake*](#upsertmistake)
  - [*ResolveMistake*](#resolvemistake)
  - [*UpdateMistakeNote*](#updatemistakenote)
  - [*UpdateMistakeType*](#updatemistaketype)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `mech-prep-app-connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@mech-prep-app/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@mech-prep-app/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@mech-prep-app/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `mech-prep-app-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListUserMistakes
You can execute the `ListUserMistakes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
listUserMistakes(vars: ListUserMistakesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserMistakesData, ListUserMistakesVariables>;

interface ListUserMistakesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUserMistakesVariables): QueryRef<ListUserMistakesData, ListUserMistakesVariables>;
}
export const listUserMistakesRef: ListUserMistakesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUserMistakes(dc: DataConnect, vars: ListUserMistakesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserMistakesData, ListUserMistakesVariables>;

interface ListUserMistakesRef {
  ...
  (dc: DataConnect, vars: ListUserMistakesVariables): QueryRef<ListUserMistakesData, ListUserMistakesVariables>;
}
export const listUserMistakesRef: ListUserMistakesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUserMistakesRef:
```typescript
const name = listUserMistakesRef.operationName;
console.log(name);
```

### Variables
The `ListUserMistakes` query requires an argument of type `ListUserMistakesVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListUserMistakesVariables {
  userId: string;
}
```
### Return Type
Recall that executing the `ListUserMistakes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUserMistakesData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUserMistakesData {
  mistakes: ({
    userId: string;
    questionId: string;
    category: string;
    topic: string;
    type: string;
    mistakeType: string;
    userOverrideType?: string | null;
    firstIncorrectAt: TimestampString;
    lastIncorrectAt: TimestampString;
    timesIncorrect: number;
    isResolved: boolean;
    resolvedAt?: TimestampString | null;
    userNote?: string | null;
  } & Mistake_Key)[];
}
```
### Using `ListUserMistakes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUserMistakes, ListUserMistakesVariables } from '@mech-prep-app/dataconnect';

// The `ListUserMistakes` query requires an argument of type `ListUserMistakesVariables`:
const listUserMistakesVars: ListUserMistakesVariables = {
  userId: ..., 
};

// Call the `listUserMistakes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUserMistakes(listUserMistakesVars);
// Variables can be defined inline as well.
const { data } = await listUserMistakes({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUserMistakes(dataConnect, listUserMistakesVars);

console.log(data.mistakes);

// Or, you can use the `Promise` API.
listUserMistakes(listUserMistakesVars).then((response) => {
  const data = response.data;
  console.log(data.mistakes);
});
```

### Using `ListUserMistakes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUserMistakesRef, ListUserMistakesVariables } from '@mech-prep-app/dataconnect';

// The `ListUserMistakes` query requires an argument of type `ListUserMistakesVariables`:
const listUserMistakesVars: ListUserMistakesVariables = {
  userId: ..., 
};

// Call the `listUserMistakesRef()` function to get a reference to the query.
const ref = listUserMistakesRef(listUserMistakesVars);
// Variables can be defined inline as well.
const ref = listUserMistakesRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUserMistakesRef(dataConnect, listUserMistakesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.mistakes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.mistakes);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `mech-prep-app-connector` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertMistake
You can execute the `UpsertMistake` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
upsertMistake(vars: UpsertMistakeVariables): MutationPromise<UpsertMistakeData, UpsertMistakeVariables>;

interface UpsertMistakeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMistakeVariables): MutationRef<UpsertMistakeData, UpsertMistakeVariables>;
}
export const upsertMistakeRef: UpsertMistakeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertMistake(dc: DataConnect, vars: UpsertMistakeVariables): MutationPromise<UpsertMistakeData, UpsertMistakeVariables>;

interface UpsertMistakeRef {
  ...
  (dc: DataConnect, vars: UpsertMistakeVariables): MutationRef<UpsertMistakeData, UpsertMistakeVariables>;
}
export const upsertMistakeRef: UpsertMistakeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertMistakeRef:
```typescript
const name = upsertMistakeRef.operationName;
console.log(name);
```

### Variables
The `UpsertMistake` mutation requires an argument of type `UpsertMistakeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertMistakeVariables {
  userId: string;
  questionId: string;
  category: string;
  topic: string;
  type: string;
  mistakeType: string;
  firstIncorrectAt: TimestampString;
  lastIncorrectAt: TimestampString;
  timesIncorrect: number;
  isResolved: boolean;
}
```
### Return Type
Recall that executing the `UpsertMistake` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertMistakeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertMistakeData {
  mistake_upsert: Mistake_Key;
}
```
### Using `UpsertMistake`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertMistake, UpsertMistakeVariables } from '@mech-prep-app/dataconnect';

// The `UpsertMistake` mutation requires an argument of type `UpsertMistakeVariables`:
const upsertMistakeVars: UpsertMistakeVariables = {
  userId: ..., 
  questionId: ..., 
  category: ..., 
  topic: ..., 
  type: ..., 
  mistakeType: ..., 
  firstIncorrectAt: ..., 
  lastIncorrectAt: ..., 
  timesIncorrect: ..., 
  isResolved: ..., 
};

// Call the `upsertMistake()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertMistake(upsertMistakeVars);
// Variables can be defined inline as well.
const { data } = await upsertMistake({ userId: ..., questionId: ..., category: ..., topic: ..., type: ..., mistakeType: ..., firstIncorrectAt: ..., lastIncorrectAt: ..., timesIncorrect: ..., isResolved: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertMistake(dataConnect, upsertMistakeVars);

console.log(data.mistake_upsert);

// Or, you can use the `Promise` API.
upsertMistake(upsertMistakeVars).then((response) => {
  const data = response.data;
  console.log(data.mistake_upsert);
});
```

### Using `UpsertMistake`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertMistakeRef, UpsertMistakeVariables } from '@mech-prep-app/dataconnect';

// The `UpsertMistake` mutation requires an argument of type `UpsertMistakeVariables`:
const upsertMistakeVars: UpsertMistakeVariables = {
  userId: ..., 
  questionId: ..., 
  category: ..., 
  topic: ..., 
  type: ..., 
  mistakeType: ..., 
  firstIncorrectAt: ..., 
  lastIncorrectAt: ..., 
  timesIncorrect: ..., 
  isResolved: ..., 
};

// Call the `upsertMistakeRef()` function to get a reference to the mutation.
const ref = upsertMistakeRef(upsertMistakeVars);
// Variables can be defined inline as well.
const ref = upsertMistakeRef({ userId: ..., questionId: ..., category: ..., topic: ..., type: ..., mistakeType: ..., firstIncorrectAt: ..., lastIncorrectAt: ..., timesIncorrect: ..., isResolved: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertMistakeRef(dataConnect, upsertMistakeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mistake_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mistake_upsert);
});
```

## ResolveMistake
You can execute the `ResolveMistake` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
resolveMistake(vars: ResolveMistakeVariables): MutationPromise<ResolveMistakeData, ResolveMistakeVariables>;

interface ResolveMistakeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ResolveMistakeVariables): MutationRef<ResolveMistakeData, ResolveMistakeVariables>;
}
export const resolveMistakeRef: ResolveMistakeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
resolveMistake(dc: DataConnect, vars: ResolveMistakeVariables): MutationPromise<ResolveMistakeData, ResolveMistakeVariables>;

interface ResolveMistakeRef {
  ...
  (dc: DataConnect, vars: ResolveMistakeVariables): MutationRef<ResolveMistakeData, ResolveMistakeVariables>;
}
export const resolveMistakeRef: ResolveMistakeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the resolveMistakeRef:
```typescript
const name = resolveMistakeRef.operationName;
console.log(name);
```

### Variables
The `ResolveMistake` mutation requires an argument of type `ResolveMistakeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ResolveMistakeVariables {
  userId: string;
  questionId: string;
  resolvedAt: TimestampString;
}
```
### Return Type
Recall that executing the `ResolveMistake` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ResolveMistakeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ResolveMistakeData {
  mistake_update?: Mistake_Key | null;
}
```
### Using `ResolveMistake`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, resolveMistake, ResolveMistakeVariables } from '@mech-prep-app/dataconnect';

// The `ResolveMistake` mutation requires an argument of type `ResolveMistakeVariables`:
const resolveMistakeVars: ResolveMistakeVariables = {
  userId: ..., 
  questionId: ..., 
  resolvedAt: ..., 
};

// Call the `resolveMistake()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await resolveMistake(resolveMistakeVars);
// Variables can be defined inline as well.
const { data } = await resolveMistake({ userId: ..., questionId: ..., resolvedAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await resolveMistake(dataConnect, resolveMistakeVars);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
resolveMistake(resolveMistakeVars).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```

### Using `ResolveMistake`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, resolveMistakeRef, ResolveMistakeVariables } from '@mech-prep-app/dataconnect';

// The `ResolveMistake` mutation requires an argument of type `ResolveMistakeVariables`:
const resolveMistakeVars: ResolveMistakeVariables = {
  userId: ..., 
  questionId: ..., 
  resolvedAt: ..., 
};

// Call the `resolveMistakeRef()` function to get a reference to the mutation.
const ref = resolveMistakeRef(resolveMistakeVars);
// Variables can be defined inline as well.
const ref = resolveMistakeRef({ userId: ..., questionId: ..., resolvedAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = resolveMistakeRef(dataConnect, resolveMistakeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```

## UpdateMistakeNote
You can execute the `UpdateMistakeNote` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateMistakeNote(vars: UpdateMistakeNoteVariables): MutationPromise<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;

interface UpdateMistakeNoteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMistakeNoteVariables): MutationRef<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;
}
export const updateMistakeNoteRef: UpdateMistakeNoteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateMistakeNote(dc: DataConnect, vars: UpdateMistakeNoteVariables): MutationPromise<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;

interface UpdateMistakeNoteRef {
  ...
  (dc: DataConnect, vars: UpdateMistakeNoteVariables): MutationRef<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;
}
export const updateMistakeNoteRef: UpdateMistakeNoteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateMistakeNoteRef:
```typescript
const name = updateMistakeNoteRef.operationName;
console.log(name);
```

### Variables
The `UpdateMistakeNote` mutation requires an argument of type `UpdateMistakeNoteVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateMistakeNoteVariables {
  userId: string;
  questionId: string;
  userNote: string;
}
```
### Return Type
Recall that executing the `UpdateMistakeNote` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateMistakeNoteData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateMistakeNoteData {
  mistake_update?: Mistake_Key | null;
}
```
### Using `UpdateMistakeNote`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateMistakeNote, UpdateMistakeNoteVariables } from '@mech-prep-app/dataconnect';

// The `UpdateMistakeNote` mutation requires an argument of type `UpdateMistakeNoteVariables`:
const updateMistakeNoteVars: UpdateMistakeNoteVariables = {
  userId: ..., 
  questionId: ..., 
  userNote: ..., 
};

// Call the `updateMistakeNote()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateMistakeNote(updateMistakeNoteVars);
// Variables can be defined inline as well.
const { data } = await updateMistakeNote({ userId: ..., questionId: ..., userNote: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateMistakeNote(dataConnect, updateMistakeNoteVars);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
updateMistakeNote(updateMistakeNoteVars).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```

### Using `UpdateMistakeNote`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateMistakeNoteRef, UpdateMistakeNoteVariables } from '@mech-prep-app/dataconnect';

// The `UpdateMistakeNote` mutation requires an argument of type `UpdateMistakeNoteVariables`:
const updateMistakeNoteVars: UpdateMistakeNoteVariables = {
  userId: ..., 
  questionId: ..., 
  userNote: ..., 
};

// Call the `updateMistakeNoteRef()` function to get a reference to the mutation.
const ref = updateMistakeNoteRef(updateMistakeNoteVars);
// Variables can be defined inline as well.
const ref = updateMistakeNoteRef({ userId: ..., questionId: ..., userNote: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateMistakeNoteRef(dataConnect, updateMistakeNoteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```

## UpdateMistakeType
You can execute the `UpdateMistakeType` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect/index.d.ts](./index.d.ts):
```typescript
updateMistakeType(vars: UpdateMistakeTypeVariables): MutationPromise<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;

interface UpdateMistakeTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMistakeTypeVariables): MutationRef<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;
}
export const updateMistakeTypeRef: UpdateMistakeTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateMistakeType(dc: DataConnect, vars: UpdateMistakeTypeVariables): MutationPromise<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;

interface UpdateMistakeTypeRef {
  ...
  (dc: DataConnect, vars: UpdateMistakeTypeVariables): MutationRef<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;
}
export const updateMistakeTypeRef: UpdateMistakeTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateMistakeTypeRef:
```typescript
const name = updateMistakeTypeRef.operationName;
console.log(name);
```

### Variables
The `UpdateMistakeType` mutation requires an argument of type `UpdateMistakeTypeVariables`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateMistakeTypeVariables {
  userId: string;
  questionId: string;
  userOverrideType: string;
}
```
### Return Type
Recall that executing the `UpdateMistakeType` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateMistakeTypeData`, which is defined in [dataconnect/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateMistakeTypeData {
  mistake_update?: Mistake_Key | null;
}
```
### Using `UpdateMistakeType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateMistakeType, UpdateMistakeTypeVariables } from '@mech-prep-app/dataconnect';

// The `UpdateMistakeType` mutation requires an argument of type `UpdateMistakeTypeVariables`:
const updateMistakeTypeVars: UpdateMistakeTypeVariables = {
  userId: ..., 
  questionId: ..., 
  userOverrideType: ..., 
};

// Call the `updateMistakeType()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateMistakeType(updateMistakeTypeVars);
// Variables can be defined inline as well.
const { data } = await updateMistakeType({ userId: ..., questionId: ..., userOverrideType: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateMistakeType(dataConnect, updateMistakeTypeVars);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
updateMistakeType(updateMistakeTypeVars).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```

### Using `UpdateMistakeType`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateMistakeTypeRef, UpdateMistakeTypeVariables } from '@mech-prep-app/dataconnect';

// The `UpdateMistakeType` mutation requires an argument of type `UpdateMistakeTypeVariables`:
const updateMistakeTypeVars: UpdateMistakeTypeVariables = {
  userId: ..., 
  questionId: ..., 
  userOverrideType: ..., 
};

// Call the `updateMistakeTypeRef()` function to get a reference to the mutation.
const ref = updateMistakeTypeRef(updateMistakeTypeVars);
// Variables can be defined inline as well.
const ref = updateMistakeTypeRef({ userId: ..., questionId: ..., userOverrideType: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateMistakeTypeRef(dataConnect, updateMistakeTypeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mistake_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mistake_update);
});
```


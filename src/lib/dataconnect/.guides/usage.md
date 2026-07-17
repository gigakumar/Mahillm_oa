# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertMistake, resolveMistake, updateMistakeNote, updateMistakeType, listUserMistakes } from '@mech-prep-app/dataconnect';


// Operation UpsertMistake:  For variables, look at type UpsertMistakeVars in ../index.d.ts
const { data } = await UpsertMistake(dataConnect, upsertMistakeVars);

// Operation ResolveMistake:  For variables, look at type ResolveMistakeVars in ../index.d.ts
const { data } = await ResolveMistake(dataConnect, resolveMistakeVars);

// Operation UpdateMistakeNote:  For variables, look at type UpdateMistakeNoteVars in ../index.d.ts
const { data } = await UpdateMistakeNote(dataConnect, updateMistakeNoteVars);

// Operation UpdateMistakeType:  For variables, look at type UpdateMistakeTypeVars in ../index.d.ts
const { data } = await UpdateMistakeType(dataConnect, updateMistakeTypeVars);

// Operation ListUserMistakes:  For variables, look at type ListUserMistakesVars in ../index.d.ts
const { data } = await ListUserMistakes(dataConnect, listUserMistakesVars);


```
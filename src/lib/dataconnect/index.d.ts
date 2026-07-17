import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




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

export interface ListUserMistakesVariables {
  userId: string;
}

export interface Mistake_Key {
  userId: string;
  questionId: string;
  __typename?: 'Mistake_Key';
}

export interface ResolveMistakeData {
  mistake_update?: Mistake_Key | null;
}

export interface ResolveMistakeVariables {
  userId: string;
  questionId: string;
  resolvedAt: TimestampString;
}

export interface UpdateMistakeNoteData {
  mistake_update?: Mistake_Key | null;
}

export interface UpdateMistakeNoteVariables {
  userId: string;
  questionId: string;
  userNote: string;
}

export interface UpdateMistakeTypeData {
  mistake_update?: Mistake_Key | null;
}

export interface UpdateMistakeTypeVariables {
  userId: string;
  questionId: string;
  userOverrideType: string;
}

export interface UpsertMistakeData {
  mistake_upsert: Mistake_Key;
}

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

interface UpsertMistakeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMistakeVariables): MutationRef<UpsertMistakeData, UpsertMistakeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertMistakeVariables): MutationRef<UpsertMistakeData, UpsertMistakeVariables>;
  operationName: string;
}
export const upsertMistakeRef: UpsertMistakeRef;

export function upsertMistake(vars: UpsertMistakeVariables): MutationPromise<UpsertMistakeData, UpsertMistakeVariables>;
export function upsertMistake(dc: DataConnect, vars: UpsertMistakeVariables): MutationPromise<UpsertMistakeData, UpsertMistakeVariables>;

interface ResolveMistakeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ResolveMistakeVariables): MutationRef<ResolveMistakeData, ResolveMistakeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ResolveMistakeVariables): MutationRef<ResolveMistakeData, ResolveMistakeVariables>;
  operationName: string;
}
export const resolveMistakeRef: ResolveMistakeRef;

export function resolveMistake(vars: ResolveMistakeVariables): MutationPromise<ResolveMistakeData, ResolveMistakeVariables>;
export function resolveMistake(dc: DataConnect, vars: ResolveMistakeVariables): MutationPromise<ResolveMistakeData, ResolveMistakeVariables>;

interface UpdateMistakeNoteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMistakeNoteVariables): MutationRef<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateMistakeNoteVariables): MutationRef<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;
  operationName: string;
}
export const updateMistakeNoteRef: UpdateMistakeNoteRef;

export function updateMistakeNote(vars: UpdateMistakeNoteVariables): MutationPromise<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;
export function updateMistakeNote(dc: DataConnect, vars: UpdateMistakeNoteVariables): MutationPromise<UpdateMistakeNoteData, UpdateMistakeNoteVariables>;

interface UpdateMistakeTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMistakeTypeVariables): MutationRef<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateMistakeTypeVariables): MutationRef<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;
  operationName: string;
}
export const updateMistakeTypeRef: UpdateMistakeTypeRef;

export function updateMistakeType(vars: UpdateMistakeTypeVariables): MutationPromise<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;
export function updateMistakeType(dc: DataConnect, vars: UpdateMistakeTypeVariables): MutationPromise<UpdateMistakeTypeData, UpdateMistakeTypeVariables>;

interface ListUserMistakesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListUserMistakesVariables): QueryRef<ListUserMistakesData, ListUserMistakesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListUserMistakesVariables): QueryRef<ListUserMistakesData, ListUserMistakesVariables>;
  operationName: string;
}
export const listUserMistakesRef: ListUserMistakesRef;

export function listUserMistakes(vars: ListUserMistakesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserMistakesData, ListUserMistakesVariables>;
export function listUserMistakes(dc: DataConnect, vars: ListUserMistakesVariables, options?: ExecuteQueryOptions): QueryPromise<ListUserMistakesData, ListUserMistakesVariables>;


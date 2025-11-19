import type { useState } from "react";

// Use the type utility below to extract the setter type from a `useState` call that is initialized with a value.
//
// At first glance, it seems appealing to use `ReturnType<typeof useState<T>`.
//
// However, this doesn't match the actual type of the setter function in situations where you pass in an initial value that isn't `undefined`.
//
// In other words: `ReturnType<typeof useState<T>>` will evaluate to `React.Dispatch<React.SetStateAction<T | undefined>>`.
//
// ...which is annoying because often you're passing in an initial value that is not `undefined`. The returned
// value from the actual `useState` call can see that you're passing an initial value and will return a type
// without the `undefined` in there.
//
// This type helper is a nice little utility that keeps you from having to copy/paste the type definition each
// time, which would be a pain and error prone.
//
// (putting this long-winded explanation here to keep the jsdoc comment from being super long)

/**
 * Use this type utility to extract the setter type from a `useState` call that is initialized with a value.
 */
export type UseStateSetter<T> = ReturnType<typeof useState<T>> extends [
	infer _State,
	infer Setter,
]
	? Setter extends React.Dispatch<React.SetStateAction<infer U>>
		? React.Dispatch<React.SetStateAction<Exclude<U, undefined>>>
		: Setter
	: never;

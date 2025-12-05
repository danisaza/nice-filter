# Text Filter Duplicate Creation Bug

## Bug Description

When creating a text filter, the filter is added to the system **twice**, resulting in duplicate filter chips in the UI.

## Reproduction Steps

1. Focus the main filter input
2. Select "text" as the column (creates a draft text filter chip)
3. Type a value (e.g., "foobar")
4. Press Enter to commit the filter

**Expected:** One filter chip with the text value
**Actual:** Two identical filter chips are created

## Root Cause

The bug occurs because `commitDraftTextFilter` is called twice:

1. **First call:** User presses Enter → `handleKeyDown` in `DraftTextFilter` calls `onCommit`
2. **Second call:** `commitDraftTextFilter` calls `inputRef.current?.focus()` to move focus to main input → this blurs the draft input → `handleBlur` fires → calls `onCommit` again

Due to React's asynchronous state updates, when `handleBlur` fires, `draftTextFilter` hasn't been set to `null` yet, so the filter is added a second time.

```
Enter pressed
    → handleKeyDown → onCommit (adds filter, sets draft to null, focuses main input)
    → blur triggered → handleBlur → onCommit (draft not null yet → adds filter AGAIN)
```

## Proposed Fix

Prevent the blur handler from committing if we're already in the process of committing. Options:

1. **Use a ref to track commit state:**

   ```typescript
   const isCommittingRef = useRef(false);

   const commitDraftTextFilter = useCallback(() => {
     if (!draftTextFilter || isCommittingRef.current) return;
     isCommittingRef.current = true;
     // ... add filter logic ...
     setDraftTextFilter(null);
     inputRef.current?.focus();
     isCommittingRef.current = false;
   }, [...]);
   ```

2. **Skip blur handler when Enter was pressed:**

   ```typescript
   // In DraftTextFilter
   const committedViaEnterRef = useRef(false);

   const handleKeyDown = (e) => {
     if (e.key === "Enter") {
       e.preventDefault();
       committedViaEnterRef.current = true;
       onCommit();
     }
   };

   const handleBlur = () => {
     if (!committedViaEnterRef.current) {
       onCommit();
     }
   };
   ```

## Test Coverage

Test added in `ChipFilterInput.test.tsx`:

```typescript
test("text filter should only be created ONCE when user presses Enter", async () => {
  // ... setup ...
  const allTextFilters = document.querySelectorAll(
    'fieldset[name="text filter"]'
  );
  expect(allTextFilters).toHaveLength(1); // Currently fails with length 2
});
```

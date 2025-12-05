# Bug: Multi-Select Filter Operator Not Set Correctly

## Summary

When creating a filter with multiple selections, the operator defaults to the single-value operator instead of the appropriate multi-value operator.

## Affected Scenarios

| Column Type             | Values Selected | Expected Operator | Actual Operator |
| ----------------------- | --------------- | ----------------- | --------------- |
| Radio (e.g., `status`)  | Multiple        | `is any of`       | `is` ❌         |
| Checkbox (e.g., `tags`) | Multiple        | `include all of`  | `include` ❌    |

## Reproduction Steps

### Radio Column (status)

1. Type "status" and select the column
2. Select "Not Started" and "Completed" using space
3. Press Enter to apply
4. **Bug**: Operator shows "is" instead of "is any of"

### Checkbox Column (tags)

1. Type "tags" and select the column
2. Select "Bug" and "Documentation" using space
3. Press Enter to apply
4. **Bug**: Operator shows "include" instead of "include all of"

## Root Cause

In `src/hooks/useFilters/useFilters.tsx`, the `addFilter` function hardcodes single-value operators:

```typescript
// Lines 150-161: Radio filters always use OPERATORS.IS
if (selectionType === SELECTION_TYPES.RADIO) {
  const radioValues = {
    // ...
    relationship: OPERATORS.IS, // ❌ Ignores values.length
  };
}

// Lines 164-177: Checkbox filters always use OPERATORS.INCLUDE
if (selectionType === SELECTION_TYPES.CHECKBOXES) {
  const checkboxValues = {
    // ...
    relationship: OPERATORS.INCLUDE, // ❌ Ignores values.length
  };
}
```

## Proposed Fix

Check `values.length` and set the appropriate operator:

```typescript
if (selectionType === SELECTION_TYPES.RADIO) {
  const radioValues = {
    propertyNameSingular: propertyNameSingular,
    propertyNamePlural: undefined,
    selectionType: SELECTION_TYPES.RADIO,
    relationship: values.length > 1 ? OPERATORS.IS_ANY_OF : OPERATORS.IS,
  };
  setFilters((prev) => [...prev, { ...newFilter, ...radioValues }]);
  return;
}

if (selectionType === SELECTION_TYPES.CHECKBOXES) {
  const checkboxValues = {
    propertyNameSingular: undefined,
    propertyNamePlural: propertyNamePlural,
    selectionType: SELECTION_TYPES.CHECKBOXES,
    relationship:
      values.length > 1 ? OPERATORS.INCLUDE_ALL_OF : OPERATORS.INCLUDE,
  };
  setFilters((prev) => [...prev, { ...newFilter, ...checkboxValues }]);
  return;
}
```

## Tests

Failing tests added in `ChipFilterInput.test.tsx` under:

```
describe("BUG: Filter operator not set correctly for multi-select")
```

| Test                                               | Interaction                     |
| -------------------------------------------------- | ------------------------------- |
| Radio: keyboard multi-select → "is any of"         | Space + Arrow + Space + Enter   |
| Radio: mouse multi-select → "is any of"            | Click checkboxes + click option |
| Checkbox: keyboard multi-select → "include all of" | Space + Arrow + Space + Enter   |
| Checkbox: mouse multi-select → "include all of"    | Click checkboxes + click option |
| Radio: single select → "is" ✅                     | Enter on single option          |
| Checkbox: single select → "include" ✅             | Enter on single option          |

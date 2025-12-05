# Changeset: Multi-select improvements, blur-to-commit behavior, distinct filters fix, and match type dropdown

## Summary

This changeset improves the multi-select behavior in the ChipFilterInput component, fixes a bug where pending selections were discarded when clicking away from the dropdown, fixes a critical bug where multiple filters for the same category were incorrectly merged together, and adds a new dropdown to toggle between "all filters must match" and "any filter must match" modes.

## Changes

### Bug Fix: Commit pending selections on blur

**File:** `ChipFilterInput.tsx`

Previously, clicking away from the dropdown while having pending multi-select values would discard those selections. Now, pending selections are automatically committed as a filter when the input loses focus.

```tsx
const handleInputBlur = () => {
  // Commit any pending selections before closing
  if (pendingSelections.size > 0) {
    commitPendingSelections();
  }
  setIsInputFocused(false);
};
```

### Bug Fix: Dropdown works independently of legacy Filters component

**File:** `ComponentPreview.tsx`

Previously, the autocomplete dropdown would not appear when focusing the input if the legacy `Filters` component was not rendered. This was because `ChipFilterInput` relies on `filterCategories` from context, which was only populated by the legacy `Filters` component's `useEffect`.

Now, `ComponentPreview` initializes filter categories itself, matching the pattern used by `Filters.tsx`. This allows the chipified filter input to work standalone.

```tsx
useEffect(() => {
  if (filterCategories.length > 0) return;
  setFilterCategories(FILTER_CATEGORIES);
}, []);
```

### Bug Fix: Hover state bleeding between filter chips

**File:** `ChipFilterInput.tsx`

Hovering over one filter chip would erroneously cause the "operator" button (e.g., "include") of another filter chip to show a hover state. This was caused by using a `<label>` element as the container wrapper, which has special HTML behavior that can propagate hover states to nested interactive elements.

Changed the container from `<label>` to `<div>` to ensure proper hover isolation between filter chips.

### Bug Fix: Multiple filters for the same category are now distinct (not merged)

**File:** `ChipFilterInput.tsx`

Previously, when a user created a filter for a category that already had an existing filter, the new value would be merged into the existing filter instead of creating a separate, distinct filter. This prevented users from creating multiple independent filters for the same category (e.g., `status IS "Open"` AND `status IS NOT "Closed"`).

**Repro steps (before fix):**

1. Create a filter: `status: Not Started`
2. Create another filter: `status: In Progress`
3. **Bug:** Instead of two separate filters, the values were merged into one filter showing "Not Started, In Progress"

**Fix:** Renamed `addOrUpdateFilter` to `createNewFilter` and removed the merging logic. Now every filter creation results in a new, distinct filter regardless of whether a filter for that category already exists.

```tsx
// Before (buggy): Would merge values into existing filter
const existingFilter = filters.find((f) => f.categoryId === categoryId);
if (existingFilter) {
  updateFilterValues(existingFilter.id, (prevValues) => [
    ...prevValues,
    comboboxOption,
  ]);
}

// After (fixed): Always creates a new distinct filter
const newFilter = {
  id: uuidv4(),
  categoryId: filterOption.id,
  // ...
  values: [comboboxOption],
};
addFilter(newFilter);
```

### Bug Fix: Enter key now includes highlighted option with pending selections

**File:** `ChipFilterInput.tsx`

When using multi-select (Space to toggle options), pressing Enter would only commit the space-selected options and ignore the currently highlighted option. Now, the highlighted option is also included when pressing Enter.

**Repro steps (before fix):**

1. Select a column (e.g., `priority:`)
2. Press Space to select "Low"
3. Arrow down to highlight "High"
4. Press Enter
5. **Bug:** Filter only contained "Low", not "Low, High"

**Fix:** `commitPendingSelections` now accepts an optional `highlightedSuggestion` parameter, which is included in the final filter if not already in pending selections.

### Enhancement: Multi-select available for all column types

**Files:** `ChipFilterInput.tsx`, `AutocompleteDropdown.tsx`

Multi-select behavior (using Space to toggle selections, Enter to commit) is now available for **all** value suggestions, not just columns with `selectionType: "checkboxes"`. This provides a consistent UX regardless of the underlying filter configuration.

- Space key now toggles selection for any value suggestion
- Enter commits all pending selections
- Checkboxes are displayed for all value options in the dropdown

### Enhancement: Improved checkbox click handling in dropdown

**File:** `AutocompleteDropdown.tsx`

- Clicking the checkbox icon now toggles selection without closing the dropdown
- Clicking the option label commits all pending selections (including the clicked option)
- Added `onMouseDown={(e) => e.preventDefault()}` to prevent blur when clicking dropdown items
- Added proper ARIA attributes (`role="checkbox"`, `aria-checked`) for accessibility
- Added hover state for unchecked checkboxes

### Enhancement: Improved backspace behavior with focus management

**Files:** `ChipFilterInput.tsx`, `AppliedFilter.tsx`

Backspace now uses a two-step deletion flow with proper focus management:

1. **Backspace with empty input** → Focuses the X button of the most recent filter (instead of immediately deleting)
2. **Backspace/Enter on focused X button** → Deletes that filter
3. **After deletion** → Focus moves to the previous filter's X button, or back to the input if no filters remain

This allows users to review which filter will be deleted before confirming, and enables rapid sequential deletion by holding backspace.

### Enhancement: Match type dropdown (all/any)

**Files:** `ComponentPreview.tsx`, `useFilters.tsx`

Added a dropdown to the right of the filter input that allows users to choose between "all filters must match" (AND logic) and "any filter must match" (OR logic).

- **Default**: "all filters must match" (changed from previous default of "any")
- **Collapsed state**: Shows abbreviated label ("all" or "any")
- **Expanded state**: Shows full labels ("all filters must match" / "any filter must match")
- **Selection indicator**: Checkmark appears on the right side of the currently selected option
- Uses Radix DropdownMenu with RadioGroup for accessible single-selection behavior
- Keyboard navigation supported (Arrow keys, Enter, Escape)

```tsx
<MatchTypeDropdown matchType={matchType} setMatchType={setMatchType} />
```

### Code cleanup

**File:** `ChipFilterInput.tsx`

- Removed unused import `SELECTION_TYPES` from constants
- Removed unused `updateFilterValues` from useFilters destructuring (no longer needed after distinct filters fix)
- Renamed `addOrUpdateFilter` to `createNewFilter` to better reflect its behavior
- Simplified space key handling logic
- Added `bg-transparent dark:bg-transparent` to input for better dark mode support
- Removed setTimeout delay from blur handler (no longer needed with the new approach)

## New Tests

### File: `ChipFilterInput.distinctFilters.test.tsx` (NEW)

A dedicated test file for ensuring multiple filters of the same category remain distinct and are never merged. Contains 17 tests covering:

**Keyboard interactions - Creating multiple distinct filters:**

- `creating two filters for the same category via keyboard should result in TWO separate filters`
- `creating three filters for the same category via keyboard should result in THREE separate filters`
- `filters for different categories should remain independent`
- `typing full filter text and pressing Enter should create distinct filters`

**Mouse interactions - Creating multiple distinct filters:**

- `clicking to select two different values for the same category should create TWO separate filters`
- `clicking the same value twice should create TWO separate filters with the same value`

**Multi-select with existing filters:**

- `using multi-select (Space + Enter) should create a NEW filter, not merge with existing`
- `multi-select on tags (checkbox type) should create distinct filters from existing`
- `blur with pending selections should create NEW filter, not merge with existing`

**Edge cases - Filter distinctness:**

- `creating filters via different methods should all be distinct`
- `removing one filter should not affect other filters of same category`
- `backspace should only remove the most recent filter, not merge anything`

**Mixed category interactions:**

- `alternating between categories should maintain distinct filters`
- `rapid filter creation should not cause merging`

**Checkbox click behavior with existing filters:**

- `clicking checkbox then label should create new filter, not merge with existing`

**Values that exist in multiple filters:**

- `same value in multiple filters should be allowed and remain distinct`
- `filters with overlapping values should remain distinct`

### File: `ChipFilterInput.test.tsx`

Added new test suites:

### "Multi-select click behavior"

- `clicking option label after selecting checkboxes should include all pending selections` - Verifies that clicking checkboxes to select Bug and Feature, then clicking the Testing label, creates a filter with all three values.

### "Hover state isolation between filter chips"

- `hovering over one filter chip should not trigger hover state on another filter's operator button` - Verifies DOM isolation between filter chips
- `each filter chip's operator button should be independently hoverable` - Verifies mouseenter events fire on the correct elements only
- `hovering over the container should not trigger hover on nested operator buttons` - Verifies container hover doesn't affect nested buttons
- `the filter chips container should NOT be a label element wrapping interactive buttons` - Regression test ensuring the fix stays in place

### "Enter with pending selections and highlighted option"

- `pressing Enter should include the currently highlighted option along with pending selections` - Verifies that space-selecting "Low", then arrowing to "High" and pressing Enter creates a filter with both values
- `pressing Enter with multiple pending selections should include highlighted option as well` - Verifies that space-selecting "Low" and "Medium", then arrowing to "High" and pressing Enter creates a filter with all three values

### "Blur with pending selections"

- `clicking away from dropdown with pending selections should apply the filter` - Verifies single pending selection is committed on blur
- `clicking away from dropdown with multiple pending selections should apply all as a single filter` - Verifies multiple pending selections are committed as one filter on blur

### "Backspace key and filter focus management"

- `pressing Backspace when input is empty focuses the last filter's X button` - Verifies focus moves to X button instead of deleting
- `pressing Backspace on a focused X button deletes the filter` - Verifies second backspace deletes
- `pressing Enter on a focused X button deletes the filter` - Verifies Enter also works for deletion
- `when a filter is deleted, focus moves to the previous filter's X button` - Verifies focus chain
- `when the only filter is deleted, focus moves to the input` - Verifies fallback to input
- `clicking the X button to remove a filter focuses the previous filter's X button` - Verifies mouse click also triggers focus management
- `deleting multiple filters in sequence maintains proper focus chain` - Verifies rapid sequential deletion

### File: `ComponentPreview.test.tsx` (NEW)

A dedicated test file for the ComponentPreview component, focusing on the MatchTypeDropdown. Contains 15 tests covering:

**MatchTypeDropdown behavior:**

- `renders with default 'all' match type`
- `opens dropdown when clicked`
- `shows full labels in dropdown options`
- `'all' option is checked by default`
- `shows checkmark next to currently selected option`
- `selecting 'any' changes the button text to 'any'`
- `selecting 'any' then reopening shows 'any' as checked`
- `can switch from 'any' back to 'all'`
- `dropdown closes after selecting an option`
- `dropdown can be closed with Escape key`
- `keyboard navigation works in dropdown`
- `checkmark only appears on selected option, not on unselected`
- `checkmark moves to newly selected option`

**Layout:**

- `renders ChipFilterInput alongside match type dropdown`
- `filter input and match type dropdown are both rendered`

### Updated tests

- Renamed and updated `space selects highlighted option...` → `space toggles highlighted option...` to reflect new multi-select behavior
- Renamed and updated `space triggers filter creation...` → `space toggles selection...` to reflect new behavior
- Updated assertions to account for the two-step flow (Space to toggle, Enter to commit)

## Migration Notes

This is a non-breaking change. The component API remains the same, but users will notice:

1. **Distinct filters**: Creating multiple filters for the same category now results in separate, independent filters instead of merging values together. This allows for more complex filter combinations (e.g., `status IS "Open"` AND `status IS NOT "Closed"`).
2. **Improved UX**: Clicking away no longer loses pending selections
3. **Consistent multi-select**: All filter columns now support multi-select via Space key
4. **Visual feedback**: All value options now show checkboxes, making it clearer that multiple values can be selected
5. **Two-step backspace deletion**: Pressing Backspace with an empty input now focuses the X button first, requiring a second Backspace (or Enter) to confirm deletion. Focus automatically moves to the previous filter after deletion.
6. **Match type selector**: A new dropdown appears to the right of the filter input, allowing users to toggle between "all" (AND) and "any" (OR) filter matching. The default is now "all filters must match" (previously "any").

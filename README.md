Hey, Streak team! Here's a Loom walkthrough for this code sample:
https://www.loom.com/share/40ab62dd3c864038a21247b8280a7bc4

# Nice Filter

A sophisticated, reusable filtering system for React applications built with TypeScript. The core of this project is `useFilters` - a reusable hook that manages filter state and filters data client-side. Simply provide your data and filter categories, and the hook handles filter state management, filtering logic, and provides filtered results automatically.

To show the hook in use, the repo also includes a UI. It's a rough reproduction of Linear's filtering experience, with a focus on performance, accessibility, and aesthetics.'

## Limitations and future extensions

### ~Better / more granular caching~ Done! ✅

Right now, if the filters don't change, I don't recompute the filtered rows. However, if ANY filter changes, I recompute EVERYTHING. That's obviously inefficient.

### Adding more supported column types

Currently, only `string` and `string[]` values are supported. (good for things like statuses, tags, etc). I'd like to extend it to other data types in the future (numbers, dates, etc)

With new types would come new operators like "greater than", "less than", etc.

### Fetching data on behalf of users (or letting them do their own thing)

Also, the hook assumes that you'll provide it a bunch of data right now, and all the filtering is done client-side - which is not particularly useful in a real-world setting. It would be nice to have different "modes" that the caller can use: one where the hook never touches your data, one where it does all data fetching / filtering for you, etc.

### Adding more testing

This is relatively complex code and would definitely benefit from more tests.

## Usage / setup

```bash
pnpm install
pnpm prepare  # sets up pre-commit hooks with husky
pnpm dev
```

### Basic Example

```typescript
import {
  createFiltersContext,
  FiltersProvider,
} from "@/hooks/useFilters/useFilters";

// define your data type, which must extend Record<string, SupportedValue>
// currently, SupportedValue = string | string[]
type MyRow = {
  status: string;
  tags: string[];
  favoriteColor: string;
};

const ROWS: MyRow[] = [
  /* ... */
];

// Create a filter context for your data type
const [useFilters, FiltersContext] = createFiltersContext<MyRow>();

function App() {
  // provide your data to the filters provider
  return (
    <FiltersProvider context={FiltersContext} rows={ROWS}>
      <YourComponent />
    </FiltersProvider>
  );
}

function YourComponent() {
  // The hook manages all filtering logic - just use filteredRows!
  const { filteredRows, addFilter, removeFilter } = useFilters();

  // filteredRows is automatically computed based on applied filters
  // No need to implement filtering logic yourself
  return (
    <grid>
      {filteredRows.map((filteredRow) => (
        <row key={filteredRow.id}>{/* render row */}</row>
      ))}
    </grid>
  );
}
```

### Filter Types

The system supports two selection types:

1. **Radio Selection** (`SELECTION_TYPES.RADIO`): For fields where a row has a single value

   - Operators: "is", "is not", "is any of"
   - Example: Status, Priority, Assignee

2. **Checkbox Selection** (`SELECTION_TYPES.CHECKBOXES`): For fields where a row can have multiple values
   - Operators: "include", "do not include", "include all of", "include any of", "exclude if any of", "exclude if all"
   - Example: Tags, Categories

### Match Types

- **ANY**: Filters for rows that match **any** of the applied filters (OR logic)
- **ALL**: Filters for rows that match **all** of the applied filters (AND logic)

Note that it's possible to create several distinct filters for the same category. For example, you could have a filter for "Status is In-Progress" and a separate one for "Status is Not-Started". At first glance, it might seem like these should be merged into a single filter ("Status is any of: Not-Started, In-Progresss"). However, I've decided to allow these to exist as independent filters in preparation for more complicated combinations of AND/OR conditions in the future.

## Filter Operators

### Radio Selection Operators

- `IS` - Row value equals the selected value
- `IS_NOT` - Row value does not equal the selected value
- `IS_ANY_OF` - Row value is one of the selected values

### Checkbox Selection Operators

- `INCLUDE` - Row includes the selected value
- `DO_NOT_INCLUDE` - Row does not include the selected value
- `INCLUDE_ALL_OF` - Row includes all selected values
- `INCLUDE_ANY_OF` - Row includes any of the selected values
- `EXCLUDE_IF_ANY_OF` - Exclude row if it includes any of the selected values
- `EXCLUDE_IF_ALL` - Exclude row if it includes all selected values

## API Reference

### `useFilters` Hook

The `useFilters` hook is a **complete filtering solution** that manages all filtering concerns on behalf of the caller. It handles filter state, applies filtering logic, and provides computed results—you never need to implement filtering logic yourself.

The hook provides the following methods and properties:

#### Methods

- `addFilter(filter)` - Add a new filter
- `removeFilter(filterId)` - Remove a filter by ID
- `removeAllFilters()` - Clear all filters
- `updateFilterValues(filterId, values)` - Update filter selected values
- `updateFilterRelationship(filterId, relationship)` - Update filter operator
- `getFilter(filterId)` - Get a filter by ID
- `getFilterOrThrow(filterId)` - Get a filter by ID (throws if not found)
- `getOptionsForFilterCategory(categoryId)` - Get available options for a filter category
- `getPropertyNameToDisplay(filterId)` - Get the display name for a filter's property
- `setFilterCategories(categories)` - Set available filter categories
- `setMatchType(type)` - Set match type (ANY/ALL)

#### Properties

- `filters` - Array of currently applied filters
- `filteredRows` - Array of rows that match the current filters
- `filterCategories` - Available filter categories
- `matchType` - Current match type (ANY/ALL)
- `totalRowCount` - Total number of rows before filtering
- `hiddenRowCount` - Number of rows hidden by filters

## License

This project is private and not licensed for use by anyone other than the author. This may change in the future, but no promises.

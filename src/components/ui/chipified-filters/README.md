# Chipified Filters

A filter input component that transforms `key:value` text into visual chips, with autocomplete support for filter keys and values.

## Usage

```tsx
import { ChipFilterInput } from "./ChipFilterInput";
import type { FilterConfig, TFilterChip } from "./types";

const filterConfig: FilterConfig[] = [
  { key: "status", values: ["open", "closed", "merged"] },
  { key: "author", values: ["dan", "sarah", "mike"] },
  { key: "label", values: ["bug", "feature", "docs"] },
];

function MyComponent() {
  const [filters, setFilters] = useState<TFilterChip[]>([]);

  return (
    <ChipFilterInput
      filters={filters}
      onFiltersChange={setFilters}
      filterConfig={filterConfig}
      placeholder="Filter issues..."
    />
  );
}
```

## Components

| File | Description |
|------|-------------|
| `ChipFilterInput.tsx` | Main component - renders input, chips, and dropdown |
| `FilterChip.tsx` | Individual chip displaying a `key:value` filter |
| `AutocompleteDropdown.tsx` | Dropdown showing filter key/value suggestions |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate dropdown options (loops at ends) |
| `Enter` | Select highlighted option or create chip |
| `Escape` | Close dropdown |
| `←` / `→` | Navigate between chips (when at input boundary) |
| `Backspace` | Delete last chip (when input is empty) |
| `Delete` | Remove focused chip |

## Types

```ts
// A filter chip representing key:value
interface TFilterChip {
  id: string;
  key: string;
  value: string;
  raw: string; // Original text, e.g. "status:open"
}

// Configuration for available filter keys
interface FilterConfig {
  key: string;
  values: string[] | "freeform"; // Predefined values or allow any
  icon?: React.ReactNode;
}
```

## Utilities

`utils.ts` exports:

- `parseFilterText(text)` — Extracts `key:value` patterns into chips
- `getAutocompleteSuggestions(input, config, currentFilters)` — Returns suggestions based on current input
- `serializeFilters(chips, freeText)` — Converts chips back to text


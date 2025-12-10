import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import type {
	ComboboxOption,
	FilterOption,
	TAppliedFilter,
} from "@/hooks/useFilters/types";

// Define a simple row type for testing
type TestRow = {
	id: string;
	status: string;
};

// Mock filter categories
const STATUS_OPTIONS: ComboboxOption[] = [
	{ label: "Not Started", value: "Not Started", id: "status-1" },
	{ label: "In Progress", value: "In Progress", id: "status-2" },
	{ label: "Completed", value: "Completed", id: "status-3" },
];

const MOCK_FILTER_CATEGORIES: FilterOption<TestRow>[] = [
	{
		id: "status-category",
		selectionType: SELECTION_TYPES.RADIO,
		propertyNameSingular: "status",
		propertyNamePlural: "statuses",
		options: STATUS_OPTIONS,
	},
];

// Create a mock applied filter
function createMockAppliedFilter(
	overrides: Partial<TAppliedFilter> = {},
): TAppliedFilter {
	return {
		id: "test-filter-1",
		createdAt: Date.now() - 10000, // Created before cutoff
		categoryId: "status-category",
		options: STATUS_OPTIONS,
		values: [STATUS_OPTIONS[0]],
		selectionType: SELECTION_TYPES.RADIO,
		propertyNameSingular: "status",
		relationship: "is",
		_cacheVersion: 0,
		...overrides,
	} as TAppliedFilter;
}

// Mock state that persists across test
let mockFilters: TAppliedFilter[] = [];
let mockFilterCategories: FilterOption<TestRow>[] = [];

// Mock the useFilters hook from App.tsx
vi.mock("@/App.tsx", () => ({
	useFilters: () => ({
		filters: mockFilters,
		filterCategories: mockFilterCategories,
		setFilterCategories: (categories: FilterOption<TestRow>[]) => {
			mockFilterCategories = categories;
		},
		addFilter: (
			filter: Omit<
				TAppliedFilter,
				"relationship" | "createdAt" | "_cacheVersion"
			>,
		) => {
			const newFilter = createMockAppliedFilter({
				id: filter.id,
				categoryId: filter.categoryId,
				values: filter.values,
			});
			mockFilters = [...mockFilters, newFilter];
		},
		removeFilter: (filterId: string) => {
			mockFilters = mockFilters.filter((f) => f.id !== filterId);
		},
		removeAllFilters: () => {
			mockFilters = [];
		},
		getFilter: (filterId: string) => mockFilters.find((f) => f.id === filterId),
		getFilterOrThrow: (filterId: string) => {
			const filter = mockFilters.find((f) => f.id === filterId);
			if (!filter) throw new Error(`Filter not found: ${filterId}`);
			return filter;
		},
		getPropertyNameToDisplay: (filterId: string) => {
			const filter = mockFilters.find((f) => f.id === filterId);
			if (!filter) return "";
			return filter.selectionType === SELECTION_TYPES.RADIO
				? filter.propertyNameSingular
				: filter.propertyNamePlural;
		},
		getOptionsForFilterCategory: (categoryId: string) => {
			const category = mockFilterCategories.find((c) => c.id === categoryId);
			return category?.options ?? [];
		},
		updateFilterValues: vi.fn(),
		updateFilterRelationship: vi.fn(),
		matchType: "any",
		setMatchType: vi.fn(),
		filteredRows: [],
		hiddenRowCount: 0,
		totalRowCount: 0,
	}),
	useFilteredRows: () => [],
}));

// Dynamic import after mocking
const { default: Filters } = await import("@/Filters");
const { NewFilterCreatedAtCutoffProvider } = await import(
	"@/hooks/useNewFilterCreatedAtCutoff"
);

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<NewFilterCreatedAtCutoffProvider>
			{children}
		</NewFilterCreatedAtCutoffProvider>
	);
}

// Helper function to find the main "Filter" button (the one that opens the filter dropdown)
function getFilterDropdownButton() {
	// The main Filter button contains the text "Filter" as direct content
	// We use getAllByRole and find the one with "Filter" text content
	const buttons = screen.getAllByRole("button");
	const filterButton = buttons.find((button) => {
		// Check if the button's text content ends with "Filter" (to match " Filter" with the icon)
		return button.textContent?.trim().endsWith("Filter");
	});
	if (!filterButton) {
		throw new Error('Could not find the main "Filter" button');
	}
	return filterButton;
}

describe("Keyboard navigation between applied filters and filter button", () => {
	beforeEach(() => {
		// Reset mock state before each test
		mockFilters = [];
		mockFilterCategories = [...MOCK_FILTER_CATEGORIES];
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("pressing ArrowRight on the rightmost applied filter moves focus to the filter button", async () => {
		const user = userEvent.setup();

		// Set up a filter before rendering
		mockFilters = [createMockAppliedFilter()];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The toolbar should be present
		const toolbar = screen.getByRole("toolbar", { name: /applied filters/i });
		expect(toolbar).toBeInTheDocument();

		// Find the applied filter's remove button (rightmost interactive element)
		const removeButton = screen.getByRole("button", { name: /remove filter/i });
		expect(removeButton).toBeInTheDocument();

		// Focus the remove button (rightmost element in applied filters)
		removeButton.focus();
		expect(document.activeElement).toBe(removeButton);

		// Press ArrowRight to move to the filter button
		await user.keyboard("{ArrowRight}");

		// The filter button should now have focus
		const filterButton = getFilterDropdownButton();
		expect(document.activeElement).toBe(filterButton);
	});

	it("Shift+Tab moves focus from filter button to the applied filters", async () => {
		const user = userEvent.setup();

		// Set up a filter before rendering
		mockFilters = [createMockAppliedFilter()];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The toolbar should be present
		const toolbar = screen.getByRole("toolbar", { name: /applied filters/i });
		expect(toolbar).toBeInTheDocument();

		// Focus the filter dropdown button
		const filterButton = getFilterDropdownButton();
		filterButton.focus();
		expect(document.activeElement).toBe(filterButton);

		// Press Shift+Tab to move focus backward
		await user.keyboard("{Shift>}{Tab}{/Shift}");

		// Focus should now be on the first focusable element in the applied filter toolbar
		// This is the "Filter relationship" button (first button with tabindex="0" in the toolbar)
		// Note: Radix Toolbar uses roving tabindex - only the first item has tabindex="0"
		const filterRelationshipButton = screen.getByRole("button", {
			name: /filter relationship/i,
		});
		expect(document.activeElement).toBe(filterRelationshipButton);
	});

	it("pressing ArrowLeft on the filter button moves focus to the rightmost applied filter", async () => {
		const user = userEvent.setup();

		// Set up a filter before rendering
		mockFilters = [createMockAppliedFilter()];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The toolbar should be present
		const toolbar = screen.getByRole("toolbar", { name: /applied filters/i });
		expect(toolbar).toBeInTheDocument();

		// Focus the filter dropdown button
		const filterButton = getFilterDropdownButton();
		filterButton.focus();
		expect(document.activeElement).toBe(filterButton);

		// Press ArrowLeft to move focus to the applied filters
		await user.keyboard("{ArrowLeft}");

		// Focus should move to the rightmost element of the applied filters (remove button)
		const removeButton = screen.getByRole("button", { name: /remove filter/i });
		expect(document.activeElement).toBe(removeButton);
	});
});

describe("Roving tabindex - only one element should have tabIndex=0", () => {
	beforeEach(() => {
		// Reset mock state before each test
		mockFilters = [];
		mockFilterCategories = [...MOCK_FILTER_CATEGORIES];
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("only one toolbar button should have tabIndex=0 when filters exist in both before and after buckets", async () => {
		// This test verifies the roving tabindex pattern is correctly implemented.
		// When filters exist in both "before" and "after" AppliedFilters components,
		// only ONE element across the entire toolbar should have tabIndex={0}.
		//
		// The bug: Both AppliedFilters components independently calculate isFirst={index === 0}
		// for their first element, causing multiple tabIndex={0} buttons.

		// Set up cutoff time - filters created before this go to "before" bucket,
		// filters created after go to "after" bucket
		const cutoffTime = Date.now();

		// Create a filter BEFORE the cutoff (will be in "before" AppliedFilters)
		const filterBeforeCutoff = createMockAppliedFilter({
			id: "filter-before",
			createdAt: cutoffTime - 10000, // 10 seconds before cutoff
		});

		// Create a filter AFTER the cutoff (will be in "after" AppliedFilters)
		const filterAfterCutoff = createMockAppliedFilter({
			id: "filter-after",
			createdAt: cutoffTime + 10000, // 10 seconds after cutoff
		});

		mockFilters = [filterBeforeCutoff, filterAfterCutoff];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The toolbar should be present
		const toolbar = screen.getByRole("toolbar", { name: /applied filters/i });
		expect(toolbar).toBeInTheDocument();

		// Get all buttons within the toolbar
		const toolbarButtons = toolbar.querySelectorAll("button");

		// Count how many buttons have tabIndex={0}
		const buttonsWithTabIndexZero = Array.from(toolbarButtons).filter(
			(button) => button.getAttribute("tabindex") === "0",
		);

		// In a roving tabindex toolbar, exactly ONE element should have tabIndex=0
		// This is the element that receives focus when tabbing into the toolbar
		expect(buttonsWithTabIndexZero.length).toBe(1);
	});
});

describe("Keyboard navigation between filter button and match type switcher", () => {
	beforeEach(() => {
		// Reset mock state before each test
		mockFilters = [];
		mockFilterCategories = [...MOCK_FILTER_CATEGORIES];
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("pressing ArrowRight on the filter button moves focus to the match type switcher", async () => {
		const user = userEvent.setup();

		// Set up TWO filters before rendering (match type switcher only shows with 2+ filters)
		mockFilters = [
			createMockAppliedFilter({ id: "filter-1" }),
			createMockAppliedFilter({ id: "filter-2", createdAt: Date.now() - 5000 }),
		];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The match type switcher should be present (only renders with 2+ filters)
		const matchTypeSwitcher = screen.getByRole("button", {
			name: /match any filter/i,
		});
		expect(matchTypeSwitcher).toBeInTheDocument();

		// Focus the filter dropdown button
		const filterButton = getFilterDropdownButton();
		filterButton.focus();
		expect(document.activeElement).toBe(filterButton);

		// Press ArrowRight to move focus to the match type switcher
		await user.keyboard("{ArrowRight}");

		// Focus should move to the match type switcher button
		expect(document.activeElement).toBe(matchTypeSwitcher);
	});

	it("pressing ArrowLeft on the match type switcher moves focus to the filter button", async () => {
		const user = userEvent.setup();

		// Set up TWO filters before rendering (match type switcher only shows with 2+ filters)
		mockFilters = [
			createMockAppliedFilter({ id: "filter-1" }),
			createMockAppliedFilter({ id: "filter-2", createdAt: Date.now() - 5000 }),
		];

		render(
			<TestWrapper>
				<Filters />
			</TestWrapper>,
		);

		// The match type switcher should be present (only renders with 2+ filters)
		const matchTypeSwitcher = screen.getByRole("button", {
			name: /match any filter/i,
		});
		expect(matchTypeSwitcher).toBeInTheDocument();

		// Focus the match type switcher button
		matchTypeSwitcher.focus();
		expect(document.activeElement).toBe(matchTypeSwitcher);

		// Press ArrowLeft to move focus to the filter button
		await user.keyboard("{ArrowLeft}");

		// Focus should move to the filter button
		const filterButton = getFilterDropdownButton();
		expect(document.activeElement).toBe(filterButton);
	});
});

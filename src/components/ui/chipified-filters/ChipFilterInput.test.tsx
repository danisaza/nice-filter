import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { useEffect } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Create a mutable container for the test context (hoisted to run first)
const testContextHolder = vi.hoisted(() => ({
	useFilters: null as (() => any) | null,
	filtersContext: null as React.Context<any> | null,
	filteredRowsContext: null as React.Context<any> | null,
}));

// Mock @/App to use our test context's useFilters hook
vi.mock("@/App", () => ({
	useFilters: function useFilters() {
		if (!testContextHolder.useFilters) {
			throw new Error(
				"Test context not initialized - ensure testContextHolder is populated before tests run",
			);
		}
		return testContextHolder.useFilters();
	},
}));

import { FILTER_CATEGORIES } from "@/hooks/filter-options-mock-data";
// Import dependencies (these don't trigger mock because they don't use @/App directly)
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";

// Import the component under test (this triggers the mock via its @/App import,
// but only defines the module - useFilters isn't called until render)
import { ChipFilterInput } from "./ChipFilterInput";

// Create the real test context
type TestRow = Record<string, string>;
const {
	useFilters: testUseFilters,
	filtersContext,
	filteredRowsContext,
} = createFiltersContext<TestRow>();

// Populate the holder (this runs after imports but before tests)
testContextHolder.useFilters = testUseFilters;
testContextHolder.filtersContext = filtersContext;
testContextHolder.filteredRowsContext = filteredRowsContext;

const mockFilterCategories = FILTER_CATEGORIES;

// Component that initializes filter categories after provider mounts
function FilterCategoriesInitializer({
	children,
}: {
	children: React.ReactNode;
}) {
	const { setFilterCategories } = testUseFilters();

	useEffect(() => {
		setFilterCategories(FILTER_CATEGORIES as any);
	}, [setFilterCategories]);

	return <>{children}</>;
}

// Test wrapper using the real FiltersProvider for proper React context reactivity
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<FiltersProvider
			context={filtersContext}
			filteredRowsContext={filteredRowsContext}
			rows={[]}
			getRowCacheKey={() => ""}
		>
			<FilterCategoriesInitializer>{children}</FilterCategoriesInitializer>
		</FiltersProvider>
	);
}

// Helper component that wraps ChipFilterInput
function ChipFilterInputWrapper() {
	return <ChipFilterInput placeholder="Filter by typing key:value..." />;
}

/**
 * Helper to find an AppliedFilter by its property name.
 * AppliedFilter renders as a fieldset with name="{propertyName} filter".
 * We query by the name attribute since fieldset's accessible name requires a legend.
 */
function getAppliedFilter(propertyName: string) {
	const fieldset = document.querySelector(
		`fieldset[name="${propertyName} filter"]`,
	);
	if (!fieldset) {
		throw new Error(
			`Unable to find AppliedFilter with name="${propertyName} filter"`,
		);
	}
	return fieldset as HTMLFieldSetElement;
}

/**
 * Helper to query for an AppliedFilter (returns null if not found).
 */
function queryAppliedFilter(propertyName: string) {
	return document.querySelector(
		`fieldset[name="${propertyName} filter"]`,
	) as HTMLFieldSetElement | null;
}

describe("ChipFilterInput", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("dropdown visibility on focus", () => {
		test("dropdown is not visible initially", () => {
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		});

		test("dropdown becomes visible when input is focused", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			const listbox = screen.getByRole("listbox");
			expect(listbox).toBeInTheDocument();

			// Should show all filter keys (from filterCategories)
			const options = within(listbox).getAllByRole("option");
			expect(options).toHaveLength(mockFilterCategories.length);
		});
	});

	describe("first option highlighted by default", () => {
		test("first option has aria-selected=true when dropdown opens", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");

			expect(options[0]).toHaveAttribute("aria-selected", "true");
			expect(options[1]).toHaveAttribute("aria-selected", "false");
		});
	});

	describe("arrow key navigation", () => {
		test("ArrowDown moves highlight to next option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// First option should be highlighted initially
			let options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");

			// Press ArrowDown
			await user.keyboard("{ArrowDown}");

			// Second option should now be highlighted
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "false");
			expect(options[1]).toHaveAttribute("aria-selected", "true");
		});

		test("ArrowUp moves highlight to previous option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Move to second option
			await user.keyboard("{ArrowDown}");

			let options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[1]).toHaveAttribute("aria-selected", "true");

			// Press ArrowUp
			await user.keyboard("{ArrowUp}");

			// First option should be highlighted again
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");
			expect(options[1]).toHaveAttribute("aria-selected", "false");
		});
	});

	describe("looping behavior", () => {
		test("ArrowUp from first option wraps to last option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// First option should be highlighted initially
			let options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");

			// Press ArrowUp - should wrap to last
			await user.keyboard("{ArrowUp}");

			options = within(screen.getByRole("listbox")).getAllByRole("option");
			const lastIndex = options.length - 1;
			expect(options[0]).toHaveAttribute("aria-selected", "false");
			expect(options[lastIndex]).toHaveAttribute("aria-selected", "true");
		});

		test("ArrowDown from last option wraps to first option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Navigate to last option
			const options = within(screen.getByRole("listbox")).getAllByRole(
				"option",
			);
			const lastIndex = options.length - 1;

			for (let i = 0; i < lastIndex; i++) {
				await user.keyboard("{ArrowDown}");
			}

			// Verify we're at the last option
			let currentOptions = within(screen.getByRole("listbox")).getAllByRole(
				"option",
			);
			expect(currentOptions[lastIndex]).toHaveAttribute(
				"aria-selected",
				"true",
			);

			// Press ArrowDown - should wrap to first
			await user.keyboard("{ArrowDown}");

			currentOptions = within(screen.getByRole("listbox")).getAllByRole(
				"option",
			);
			expect(currentOptions[0]).toHaveAttribute("aria-selected", "true");
			expect(currentOptions[lastIndex]).toHaveAttribute(
				"aria-selected",
				"false",
			);
		});
	});

	describe("Enter on column key", () => {
		test("pressing Enter on a key suggestion adds the key and colon to input and shows values", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// First option should be "status:" - press Enter
			await user.keyboard("{Enter}");

			// Input should now contain "status:"
			expect(input).toHaveValue("status:");

			// Dropdown should now show value options for status
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");

			// Should show the status values (from FILTER_CATEGORIES)
			expect(options.length).toBeGreaterThan(0);
			expect(options[0]).toHaveTextContent("Not Started");

			// First value option should be highlighted
			expect(options[0]).toHaveAttribute("aria-selected", "true");
		});
	});

	describe("Enter on value creates chip", () => {
		test("pressing Enter on a value suggestion creates a filter and clears input", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Select "status:" key
			await user.keyboard("{Enter}");

			// Now select first value option (should be "Not Started")
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created for "status"
			const appliedFilter = getAppliedFilter("status");
			expect(appliedFilter).toBeInTheDocument();
			// Check it displays the property name and selected value
			expect(within(appliedFilter).getByText("status")).toBeInTheDocument();
			expect(
				within(appliedFilter).getByText("Not Started"),
			).toBeInTheDocument();
		});

		test("pressing Enter on a value with spaces (like 'Not Started') creates a filter correctly", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "status:Not Started" manually
			await user.type(input, "status:Not Started");

			// Press Enter to create the filter
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created for "status" with "Not Started"
			const appliedFilter = getAppliedFilter("status");
			expect(appliedFilter).toBeInTheDocument();
			expect(within(appliedFilter).getByText("status")).toBeInTheDocument();
			expect(
				within(appliedFilter).getByText("Not Started"),
			).toBeInTheDocument();
		});

		test("can navigate to different value with arrow keys before selecting", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Select "status:" key
			await user.keyboard("{Enter}");

			// Navigate to second option
			await user.keyboard("{ArrowDown}");

			// Select it
			await user.keyboard("{Enter}");

			// An AppliedFilter should be created
			const appliedFilter = getAppliedFilter("status");
			expect(appliedFilter).toBeInTheDocument();
		});

		test("input is focused and dropdown is visible immediately after creating a filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Select "status:" key
			await user.keyboard("{Enter}");

			// Select first value to create filter
			await user.keyboard("{Enter}");

			// Verify filter was created
			const appliedFilter = getAppliedFilter("status");
			expect(appliedFilter).toBeInTheDocument();

			// Input should still be focused after filter creation
			expect(input).toHaveFocus();

			// Dropdown should be visible with filter key suggestions
			const listbox = screen.getByRole("listbox");
			expect(listbox).toBeInTheDocument();

			// Should show filter key options (the initial autocomplete suggestions)
			const options = within(listbox).getAllByRole("option");
			expect(options.length).toBeGreaterThan(0);
		});
	});

	describe("Smart space key behavior", () => {
		test("space selects first option when input is empty and dropdown is open", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Dropdown should be open with first option highlighted
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");

			// Input should be empty
			expect(input).toHaveValue("");

			// Press space - should select the first option (status:)
			await user.keyboard(" ");

			// Input should now contain the key with colon (e.g., "status:")
			expect(input).toHaveValue("status:");

			// Space should NOT have been typed into the input
			expect(input).not.toHaveValue(" ");
		});

		test("space selects highlighted option after arrow navigation when input is empty", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// First option should be highlighted initially
			let options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");

			// Navigate down to second option
			await user.keyboard("{ArrowDown}");

			// Second option should now be highlighted
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[1]).toHaveAttribute("aria-selected", "true");

			// Get the text of the second option for later verification
			const secondOptionText = options[1].textContent?.replace(":", "") || "";

			// Press space - should select the highlighted (second) option
			await user.keyboard(" ");

			// Input should contain the second option key with colon
			expect(input).toHaveValue(`${secondOptionText}:`);

			// Space should NOT have been typed into the input
			expect(input).not.toHaveValue(" ");
		});

		test("space selects highlighted option after arrow key navigation (not first match)", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "priority:" to show the priority values (Low, Medium, High)
			await user.type(input, "priority:");
			expect(input).toHaveValue("priority:");

			// Verify dropdown shows priority values with first option (Low) highlighted
			const listbox = screen.getByRole("listbox");
			let options = within(listbox).getAllByRole("option");
			expect(options[0]).toHaveTextContent("Low");
			expect(options[0]).toHaveAttribute("aria-selected", "true");
			expect(options[1]).toHaveTextContent("Medium");
			expect(options[1]).toHaveAttribute("aria-selected", "false");

			// Navigate down to highlight "Medium" instead of "Low"
			await user.keyboard("{ArrowDown}");

			// Verify "Medium" is now highlighted
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "false");
			expect(options[1]).toHaveAttribute("aria-selected", "true");

			// Press space - should select the HIGHLIGHTED option (Medium), not the first one (Low)
			await user.keyboard(" ");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created with "Medium", not "Low"
			const appliedFilter = getAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			expect(within(appliedFilter).getByText("Medium")).toBeInTheDocument();
			expect(within(appliedFilter).queryByText("Low")).not.toBeInTheDocument();
		});

		test("space adds to input when it would be a valid prefix (e.g. 'not' -> 'not ')", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "status:not" (prefix of "Not Started")
			await user.type(input, "status:not");
			expect(input).toHaveValue("status:not");

			// Press space - should add space since "not " is a valid prefix
			await user.keyboard(" ");

			// Input should have the space added
			expect(input).toHaveValue("status:not ");

			// No filter should be created yet
			expect(queryAppliedFilter("status")).not.toBeInTheDocument();
		});

		test("space triggers filter creation when it would NOT be a valid prefix (e.g. 'Low')", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "priority:Low" (complete match, no option starts with "Low ")
			await user.type(input, "priority:Low");
			expect(input).toHaveValue("priority:Low");

			// Press space - should create filter since "Low " is NOT a valid prefix
			await user.keyboard(" ");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created
			const appliedFilter = getAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			expect(within(appliedFilter).getByText("Low")).toBeInTheDocument();
		});
	});

	describe("Backspace key deletes filter", () => {
		test("pressing Backspace when input is empty deletes the last filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter: select "status:" key, then first value
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			// Verify filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("status");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Ensure input is empty (it should be after filter creation)
			expect(input).toHaveValue("");

			// Press Backspace - wrap in act to ensure state updates are flushed
			await act(async () => {
				await user.keyboard("{Backspace}");
			});

			// Filter should be removed (wait for async state update)
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});
		});
	});

	describe("Dropdown position behavior", () => {
		// Helper to get the dropdown element
		function getDropdown() {
			return screen.getByRole("listbox");
		}

		// Helper to extract left position from dropdown style
		function getDropdownLeftPosition() {
			const dropdown = getDropdown();
			return Number.parseInt(dropdown.style.left, 10);
		}

		test("dropdown position is captured when autocomplete first shows", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Dropdown should be visible with a position
			const dropdown = getDropdown();
			expect(dropdown).toBeInTheDocument();
			expect(dropdown.style.left).toBeDefined();
			expect(dropdown.style.top).toBeDefined();
		});

		test("dropdown position updates when a filter is added", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Get initial position (before mocking)
			const initialLeft = getDropdownLeftPosition();

			// Mock getBoundingClientRect to simulate the input moving right after a chip is added
			const container = input.closest("[data-id]") || input.parentElement?.parentElement;
			const inputElement = input;
			const originalContainerGetBoundingClientRect = container?.getBoundingClientRect.bind(container);

			// Helper to count filters in DOM dynamically
			const getFilterCount = () => document.querySelectorAll('fieldset[name$=" filter"]').length;

			if (container) {
				vi.spyOn(container, "getBoundingClientRect").mockImplementation(() => {
					return (originalContainerGetBoundingClientRect?.() || {
						top: 100,
						left: 50,
						bottom: 150,
						right: 400,
						width: 350,
						height: 50,
						x: 50,
						y: 100,
						toJSON: () => {},
					}) as DOMRect;
				});
			}

			vi.spyOn(inputElement, "getBoundingClientRect").mockImplementation(() => {
				// Dynamically check filter count in DOM to simulate input position change
				const filterCount = getFilterCount();
				const leftOffset = filterCount * 100;
				return {
					top: 100,
					bottom: 142,
					right: 200 + leftOffset,
					width: 100,
					height: 42,
					x: 50 + leftOffset,
					y: 100,
					left: 50 + leftOffset,
					toJSON: () => {},
				} as DOMRect;
			});

			// Add a filter: select "status:" key, then first value
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			// Verify filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("status");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Get the new position - it should have updated
			const newLeft = getDropdownLeftPosition();

			// The position should have changed (increased) since the input moved right
			expect(newLeft).toBeGreaterThan(initialLeft);
		});

		test("dropdown position updates when a filter is removed", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Store original getBoundingClientRect
			const inputElement = input;
			const container = input.closest("[data-id]") || input.parentElement?.parentElement;
			const originalContainerGetBoundingClientRect = container?.getBoundingClientRect.bind(container);

			// Helper to count filters in DOM dynamically
			const getFilterCount = () => document.querySelectorAll('fieldset[name$=" filter"]').length;

			if (container) {
				vi.spyOn(container, "getBoundingClientRect").mockImplementation(() => {
					return (originalContainerGetBoundingClientRect?.() || {
						top: 100,
						left: 0,
						bottom: 150,
						right: 400,
						width: 400,
						height: 50,
						x: 0,
						y: 100,
						toJSON: () => {},
					}) as DOMRect;
				});
			}

			vi.spyOn(inputElement, "getBoundingClientRect").mockImplementation(() => {
				// Dynamically check filter count in DOM to simulate input position change
				const filterCount = getFilterCount();
				const leftOffset = filterCount * 100;
				return {
					top: 100,
					bottom: 142,
					right: 150 + leftOffset,
					width: 100,
					height: 42,
					x: 50 + leftOffset,
					y: 100,
					left: 50 + leftOffset,
					toJSON: () => {},
				} as DOMRect;
			});

			// Add a filter
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			// Verify filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("status");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Get position with filter (input moved right by 100px due to chip)
			const positionWithFilter = getDropdownLeftPosition();

			// Remove the filter with backspace
			await act(async () => {
				await user.keyboard("{Backspace}");
			});

			// Verify filter is removed
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});

			// Get position after filter removed
			const positionAfterRemoval = getDropdownLeftPosition();

			// Position should have decreased (moved back left) by 100px
			expect(positionAfterRemoval).toBeLessThan(positionWithFilter);
			expect(positionWithFilter - positionAfterRemoval).toBe(100);
		});

		test("dropdown position does NOT change when input loses and regains focus", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Get initial position
			const initialLeft = getDropdownLeftPosition();

			// Blur the input (dropdown should hide)
			await user.tab();

			// Wait for the blur timeout (200ms in handleInputBlur)
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 250));
			});

			// Dropdown should be hidden
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

			// Focus the input again
			await user.click(input);

			// Dropdown should be visible again
			await waitFor(() => {
				expect(screen.getByRole("listbox")).toBeInTheDocument();
			});

			// Position should be the same as before
			const positionAfterRefocus = getDropdownLeftPosition();
			expect(positionAfterRefocus).toBe(initialLeft);
		});

		test("dropdown position stays stable while typing (does not shift per keystroke)", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Get initial position
			const initialLeft = getDropdownLeftPosition();

			// Type several characters
			await user.type(input, "sta");

			// Position should remain the same
			const positionAfterTyping = getDropdownLeftPosition();
			expect(positionAfterTyping).toBe(initialLeft);

			// Type more
			await user.type(input, "tus:");

			// Position should still be the same
			const positionAfterMoreTyping = getDropdownLeftPosition();
			expect(positionAfterMoreTyping).toBe(initialLeft);
		});
	});
});

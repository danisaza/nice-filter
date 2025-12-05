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

	describe("Escape key resets highlighted option", () => {
		test("pressing Escape and reopening dropdown resets highlight to first option", async () => {
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
			expect(options[2]).toHaveAttribute("aria-selected", "false");

			// Navigate to third option
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");

			// Third option should now be highlighted
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "false");
			expect(options[2]).toHaveAttribute("aria-selected", "true");

			// Press Escape to close dropdown
			await user.keyboard("{Escape}");

			// Dropdown should be closed
			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

			// Blur input, then click to reopen dropdown
			await user.click(document.body);
			await user.click(input);

			// Dropdown should be visible again
			const listbox = screen.getByRole("listbox");
			expect(listbox).toBeInTheDocument();

			// First option should be highlighted again (reset on close)
			options = within(listbox).getAllByRole("option");
			expect(options[0]).toHaveAttribute("aria-selected", "true");
			expect(options[2]).toHaveAttribute("aria-selected", "false");
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

		test("space toggles highlighted option after arrow key navigation (not first match)", async () => {
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

			// Press space - should TOGGLE the HIGHLIGHTED option (Medium) for multi-select
			await user.keyboard(" ");

			// Input should still show "priority:" (multi-select mode keeps dropdown open)
			expect(input).toHaveValue("priority:");

			// Press Enter to commit the selection
			await user.keyboard("{Enter}");

			// Now input should be cleared
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

		test("space toggles selection when it would NOT be a valid prefix (e.g. 'Low')", async () => {
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

			// Press space - should toggle selection since "Low " is NOT a valid prefix
			await user.keyboard(" ");

			// Input should still have "priority:Low" (multi-select mode)
			expect(input).toHaveValue("priority:Low");

			// Press Enter to commit the selection
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created
			const appliedFilter = getAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			expect(within(appliedFilter).getByText("Low")).toBeInTheDocument();
		});
	});

	describe("Backspace key and filter focus management", () => {
		test("pressing Backspace when input is empty focuses the last filter's X button", async () => {
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

			// Press Backspace - should focus the X button, not delete the filter
			await user.keyboard("{Backspace}");

			// Filter should still exist
			const appliedFilter = getAppliedFilter("status");
			expect(appliedFilter).toBeInTheDocument();

			// The X (remove) button should be focused
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");
			expect(removeButton).toHaveFocus();
		});

		test("pressing Backspace on a focused X button deletes the filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			// Verify filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("status");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Press Backspace to focus the X button
			await user.keyboard("{Backspace}");

			// Verify X button is focused
			const appliedFilter = getAppliedFilter("status");
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");
			expect(removeButton).toHaveFocus();

			// Press Backspace again to delete the filter
			await act(async () => {
				await user.keyboard("{Backspace}");
			});

			// Filter should be removed
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});
		});

		test("pressing Enter on a focused X button deletes the filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			// Verify filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("status");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Press Backspace to focus the X button
			await user.keyboard("{Backspace}");

			// Verify X button is focused
			const appliedFilter = getAppliedFilter("status");
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");
			expect(removeButton).toHaveFocus();

			// Press Enter to delete the filter
			await act(async () => {
				await user.keyboard("{Enter}");
			});

			// Filter should be removed
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});
		});

		test("when a filter is deleted, focus moves to the previous filter's X button", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create first filter (status)
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create second filter (priority)
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			// Focus input and press Backspace to focus the last filter's X button
			await user.click(input);
			await user.keyboard("{Backspace}");

			// Verify second filter's X button is focused
			const secondFilter = getAppliedFilter("priority");
			const secondRemoveButton =
				within(secondFilter).getByLabelText("Remove filter");
			expect(secondRemoveButton).toHaveFocus();

			// Press Backspace to delete the second filter
			await act(async () => {
				await user.keyboard("{Backspace}");
			});

			// Wait for deletion and focus to move (setTimeout in handleFilterRemove)
			await waitFor(() => {
				expect(queryAppliedFilter("priority")).not.toBeInTheDocument();
			});

			// Wait for the focus to be applied (setTimeout(0) in handleFilterRemove)
			await waitFor(() => {
				const firstFilter = getAppliedFilter("status");
				const firstRemoveButton =
					within(firstFilter).getByLabelText("Remove filter");
				expect(firstRemoveButton).toHaveFocus();
			});
		});

		test("when the only filter is deleted, focus moves to the input", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a single filter
			await user.keyboard("{Enter}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Press Backspace to focus the X button
			await user.keyboard("{Backspace}");

			// Verify X button is focused
			const appliedFilter = getAppliedFilter("status");
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");
			expect(removeButton).toHaveFocus();

			// Delete the filter
			await act(async () => {
				await user.keyboard("{Backspace}");
			});

			// Wait for deletion and focus to move
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});

			// Wait for the focus to be applied (setTimeout(0) in handleFilterRemove)
			await waitFor(() => {
				expect(input).toHaveFocus();
			});
		});

		test("clicking the X button to remove a filter focuses the previous filter's X button", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create first filter (status)
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create second filter (priority)
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			// Click the X button on the second filter
			const secondFilter = getAppliedFilter("priority");
			const secondRemoveButton =
				within(secondFilter).getByLabelText("Remove filter");
			await user.click(secondRemoveButton);

			// Wait for deletion and focus to move
			await waitFor(() => {
				expect(queryAppliedFilter("priority")).not.toBeInTheDocument();
			});

			// Wait for the focus to be applied (setTimeout(0) in handleFilterRemove)
			await waitFor(() => {
				const firstFilter = getAppliedFilter("status");
				const firstRemoveButton =
					within(firstFilter).getByLabelText("Remove filter");
				expect(firstRemoveButton).toHaveFocus();
			});
		});

		test("deleting multiple filters in sequence maintains proper focus chain", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create three filters
			await user.type(input, "status:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			await user.click(input);
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("tags")).toBeInTheDocument();
			});

			// Focus input and press Backspace to focus the last filter's X button
			await user.click(input);
			await user.keyboard("{Backspace}");

			// Delete third filter (tags)
			await act(async () => {
				await user.keyboard("{Backspace}");
			});
			await waitFor(() => {
				expect(queryAppliedFilter("tags")).not.toBeInTheDocument();
			});

			// Wait for focus to move to second filter's X button
			await waitFor(() => {
				const priorityFilter = getAppliedFilter("priority");
				expect(
					within(priorityFilter).getByLabelText("Remove filter"),
				).toHaveFocus();
			});

			// Delete second filter (priority)
			await act(async () => {
				await user.keyboard("{Backspace}");
			});
			await waitFor(() => {
				expect(queryAppliedFilter("priority")).not.toBeInTheDocument();
			});

			// Wait for focus to move to first filter's X button
			await waitFor(() => {
				const statusFilter = getAppliedFilter("status");
				expect(
					within(statusFilter).getByLabelText("Remove filter"),
				).toHaveFocus();
			});

			// Delete first filter (status)
			await act(async () => {
				await user.keyboard("{Backspace}");
			});
			await waitFor(() => {
				expect(queryAppliedFilter("status")).not.toBeInTheDocument();
			});

			// Wait for focus to move to the input
			await waitFor(() => {
				expect(input).toHaveFocus();
			});
		});
	});

	describe("Multi-select click behavior", () => {
		test("clicking option label after selecting checkboxes should include all pending selections", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "tags" and press space to select the "tags" column
			await user.type(input, "tags");
			await user.keyboard(" ");

			// Input should now contain "tags:"
			expect(input).toHaveValue("tags:");

			// Dropdown should show tag value options
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");

			// Find the checkbox buttons for Bug and Feature
			const bugOption = options.find((opt) => opt.textContent?.includes("Bug"));
			const featureOption = options.find((opt) =>
				opt.textContent?.includes("Feature"),
			);
			const testingOption = options.find((opt) =>
				opt.textContent?.includes("Testing"),
			);

			expect(bugOption).toBeDefined();
			expect(featureOption).toBeDefined();
			expect(testingOption).toBeDefined();

			// Click the checkbox for "Bug" (the checkbox inside the option)
			const bugCheckbox = within(bugOption!).getByRole("checkbox");
			await user.click(bugCheckbox);

			// Click the checkbox for "Feature"
			const featureCheckbox = within(featureOption!).getByRole("checkbox");
			await user.click(featureCheckbox);

			// Dropdown should still be open with pending selections
			expect(screen.getByRole("listbox")).toBeInTheDocument();

			// Now click the label for "Testing" (click the option button itself, not the checkbox)
			// We need to click on the text part, not the checkbox button
			await user.click(testingOption!);

			// A filter should be created
			await waitFor(() => {
				// Use "tags" because propertyNamePlural is "tags"
				const appliedFilter = queryAppliedFilter("tags");
				expect(appliedFilter).toBeInTheDocument();
			});

			// The filter should include ALL three values (Bug, Feature, Testing)
			const appliedFilter = getAppliedFilter("tags");

			// Check that all three values are in the filter (rendered as comma-separated string)
			expect(
				within(appliedFilter).getByText("Bug, Feature, Testing"),
			).toBeInTheDocument();
		});
	});

	describe("Enter with pending selections and highlighted option", () => {
		test("pressing Enter should include the currently highlighted option along with pending selections", async () => {
			/**
			 * BUG REPRODUCTION:
			 * 1. Select a column (e.g., "priority:")
			 * 2. Use spacebar to select one or more options (e.g., "Low")
			 * 3. Use arrow keys to move highlighting to an unselected option (e.g., "High")
			 * 4. Press Enter
			 *
			 * EXPECTED: Filter is created with both "Low" AND "High"
			 * ACTUAL (BUG): Filter is created with only "Low" - the highlighted "High" is NOT included
			 */
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
			expect(options[2]).toHaveTextContent("High");

			// Step 2: Press space to select "Low" (adds to pending selections)
			await user.keyboard(" ");

			// Verify we're in multi-select mode (input should still show "priority:")
			expect(input).toHaveValue("priority:");
			expect(screen.getByRole("listbox")).toBeInTheDocument();

			// Step 3: Navigate down twice to highlight "High" (which is NOT selected yet)
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");

			// Verify "High" is now highlighted
			options = within(screen.getByRole("listbox")).getAllByRole("option");
			expect(options[2]).toHaveAttribute("aria-selected", "true");
			expect(options[2]).toHaveTextContent("High");

			// Step 4: Press Enter to commit
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// An AppliedFilter should be created
			const appliedFilter = getAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();

			// BUG: The filter should include BOTH "Low" (space-selected) AND "High" (highlighted when Enter pressed)
			// Currently, only "Low" is included and "High" is erroneously NOT included
			expect(within(appliedFilter).getByText("Low, High")).toBeInTheDocument();
		});

		test("pressing Enter with multiple pending selections should include highlighted option as well", async () => {
			/**
			 * More comprehensive test:
			 * 1. Select "priority:" column
			 * 2. Space to select "Low"
			 * 3. Arrow down to "Medium", Space to select it
			 * 4. Arrow down to "High" (highlight it but don't space-select)
			 * 5. Press Enter
			 *
			 * EXPECTED: Filter with "Low", "Medium", AND "High"
			 * ACTUAL (BUG): Filter with only "Low" and "Medium"
			 */
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "priority:" to show the priority values
			await user.type(input, "priority:");

			// Space to select "Low"
			await user.keyboard(" ");

			// Arrow down to "Medium" and space to select it
			await user.keyboard("{ArrowDown}");
			await user.keyboard(" ");

			// Arrow down to "High" (highlight but don't select with space)
			await user.keyboard("{ArrowDown}");

			// Verify "High" is highlighted
			const options = within(screen.getByRole("listbox")).getAllByRole(
				"option",
			);
			expect(options[2]).toHaveAttribute("aria-selected", "true");
			expect(options[2]).toHaveTextContent("High");

			// Press Enter to commit
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// Filter should include all three: Low, Medium, AND High
			const appliedFilter = getAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			expect(
				within(appliedFilter).getByText("Low, Medium, High"),
			).toBeInTheDocument();
		});
	});

	describe("Blur with pending selections", () => {
		test("clicking away from dropdown with pending selections should apply the filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "priority:" to show the priority values
			await user.type(input, "priority:");
			expect(input).toHaveValue("priority:");

			// Verify dropdown shows priority values
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");
			expect(options[0]).toHaveTextContent("Low");

			// Press space to toggle selection (creates pending selection)
			await user.keyboard(" ");

			// Verify we're in multi-select mode (input should still show "priority:")
			expect(input).toHaveValue("priority:");

			// Dropdown should still be open with the pending selection
			expect(screen.getByRole("listbox")).toBeInTheDocument();

			// Click away from the input (blur)
			await user.click(document.body);

			// Wait for blur effects
			await waitFor(() => {
				expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
			});

			// BUG: The pending selection should have been applied as a filter
			// Currently, clicking away discards the pending selection
			const appliedFilter = queryAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			expect(within(appliedFilter!).getByText("Low")).toBeInTheDocument();
		});

		test("clicking away from dropdown with multiple pending selections should apply all as a single filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type "priority:" to show the priority values
			await user.type(input, "priority:");

			// Select first option (Low) with space
			await user.keyboard(" ");

			// Navigate to second option (Medium) and select it too
			await user.keyboard("{ArrowDown}");
			await user.keyboard(" ");

			// Verify we're still in multi-select mode
			expect(input).toHaveValue("priority:");
			expect(screen.getByRole("listbox")).toBeInTheDocument();

			// Click away from the input (blur)
			await user.click(document.body);

			// Wait for blur effects
			await waitFor(() => {
				expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
			});

			// BUG: Both pending selections should have been applied as a single filter
			const appliedFilter = queryAppliedFilter("priority");
			expect(appliedFilter).toBeInTheDocument();
			// Both values should be in the filter
			expect(
				within(appliedFilter!).getByText("Low, Medium"),
			).toBeInTheDocument();
		});
	});

	/**
	 * BUG: Erroneous hover state on first filter's operator when hovering elsewhere
	 *
	 * Repro steps:
	 * 1. Apply a filter (any will do)
	 * 2. Apply a second filter
	 * 3. Move the mouse to hover over the second filter (or anywhere in the container)
	 * 4. BUG: The "operator" (e.g., "include") of the FIRST filter erroneously gains a hover state
	 *
	 * This is a CSS-level bug that cannot be fully tested in jsdom (which doesn't compute CSS).
	 * These tests verify the DOM structure and JavaScript event handling are correct,
	 * which helps narrow down the bug to a CSS/styling issue.
	 *
	 * Suspected causes:
	 * 1. The <label> element wrapping the filter chips may have unexpected hover behavior
	 * 2. CSS pseudo-class bleeding between sibling elements
	 * 3. Overlapping elements or z-index issues
	 */
	describe("Hover state isolation between filter chips", () => {
		test("hovering over one filter chip should not trigger hover state on another filter's operator button", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create first filter (tags: Bug)
			await user.type(input, "tags:");
			await user.keyboard("{Enter}"); // Select first tag value (Bug)

			// Verify first filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("tags");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Create second filter (priority: Low)
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}"); // Select first priority value (Low)

			// Verify second filter is created
			await waitFor(() => {
				const appliedFilter = getAppliedFilter("priority");
				expect(appliedFilter).toBeInTheDocument();
			});

			// Get the operator buttons from both filters
			const firstFilter = getAppliedFilter("tags");
			const secondFilter = getAppliedFilter("priority");

			const firstFilterOperator = within(firstFilter).getByLabelText(
				"Filter relationship",
			);
			const secondFilterOperator = within(secondFilter).getByLabelText(
				"Filter relationship",
			);

			// Verify both operator buttons exist and are separate elements
			expect(firstFilterOperator).toBeInTheDocument();
			expect(secondFilterOperator).toBeInTheDocument();
			expect(firstFilterOperator).not.toBe(secondFilterOperator);

			// Hover over the second filter's operator button
			await user.hover(secondFilterOperator);

			// The first filter's operator button should NOT be in any unexpected state
			// (not focused, not have data-state indicating hover, etc.)
			expect(firstFilterOperator).not.toHaveFocus();
			expect(document.activeElement).not.toBe(firstFilterOperator);

			// Verify the elements are in separate fieldsets (proper DOM isolation)
			expect(firstFilterOperator.closest("fieldset")).toBe(firstFilter);
			expect(secondFilterOperator.closest("fieldset")).toBe(secondFilter);
			expect(firstFilterOperator.closest("fieldset")).not.toBe(
				secondFilterOperator.closest("fieldset"),
			);
		});

		test("each filter chip's operator button should be independently hoverable", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create two filters
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("tags")).toBeInTheDocument();
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			const firstFilter = getAppliedFilter("tags");
			const secondFilter = getAppliedFilter("priority");
			const firstOperator = within(firstFilter).getByLabelText(
				"Filter relationship",
			);
			const secondOperator = within(secondFilter).getByLabelText(
				"Filter relationship",
			);

			// Track mouseenter events on both operators
			const firstOperatorMouseEnter = vi.fn();
			const secondOperatorMouseEnter = vi.fn();
			firstOperator.addEventListener("mouseenter", firstOperatorMouseEnter);
			secondOperator.addEventListener("mouseenter", secondOperatorMouseEnter);

			// Hover over first operator
			await user.hover(firstOperator);
			expect(firstOperatorMouseEnter).toHaveBeenCalledTimes(1);
			expect(secondOperatorMouseEnter).toHaveBeenCalledTimes(0);

			// Unhover and hover over second operator
			await user.unhover(firstOperator);
			await user.hover(secondOperator);
			expect(firstOperatorMouseEnter).toHaveBeenCalledTimes(1); // Should not increase
			expect(secondOperatorMouseEnter).toHaveBeenCalledTimes(1);

			// Cleanup
			firstOperator.removeEventListener("mouseenter", firstOperatorMouseEnter);
			secondOperator.removeEventListener(
				"mouseenter",
				secondOperatorMouseEnter,
			);
		});

		test("hovering over the container should not trigger hover on nested operator buttons", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("tags")).toBeInTheDocument();
			});

			const appliedFilter = getAppliedFilter("tags");
			const operatorButton = within(appliedFilter).getByLabelText(
				"Filter relationship",
			);

			// Find the parent container element
			const containerElement = input.closest("div.flex");
			expect(containerElement).toBeInTheDocument();

			// Track mouseenter on the operator button
			const operatorMouseEnter = vi.fn();
			operatorButton.addEventListener("mouseenter", operatorMouseEnter);

			// Hover over the container (but not directly over the operator button)
			// by hovering over the input instead
			await user.hover(input);

			// The operator button should NOT receive a mouseenter event
			// when hovering over a different part of the container
			expect(operatorMouseEnter).toHaveBeenCalledTimes(0);

			// Cleanup
			operatorButton.removeEventListener("mouseenter", operatorMouseEnter);
		});

		test("the filter chips container should NOT be a label element wrapping interactive buttons", async () => {
			/**
			 * This test ensures the hover bug fix remains in place.
			 *
			 * The <label> element has special behavior in HTML - clicking on a label
			 * focuses/clicks its associated form control. This can cause unexpected
			 * hover interactions when the label wraps interactive elements like buttons.
			 *
			 * The fix was to change the container from <label> to <div>, which prevents
			 * hover state bleeding between nested interactive elements.
			 */
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("tags")).toBeInTheDocument();
			});

			// Get the container that wraps both the filter chips and the input
			// It should be a div with flex class, not a label
			const container = input.closest("div.flex");

			// The container should be a <div>, not a <label>
			// Using a <label> would cause hover state bleeding to nested buttons
			expect(container).toBeInTheDocument();
			expect(container?.tagName.toLowerCase()).toBe("div");
			expect(container?.tagName.toLowerCase()).not.toBe("label");
		});
	});

	describe("Roving tabindex for applied filters (Radix Toolbar)", () => {
		/**
		 * Tests for the roving tabindex pattern implemented via Radix Toolbar.
		 *
		 * Expected behavior:
		 * - All applied filters act as a single tab stop
		 * - Arrow keys navigate between focusable elements within filters
		 * - Tab moves to the input (or other elements outside the toolbar)
		 */

		test("applied filters are wrapped in a toolbar with proper ARIA role", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// There should be a toolbar element wrapping the filters
			const toolbar = screen.getByRole("toolbar", {
				name: /applied filters/i,
			});
			expect(toolbar).toBeInTheDocument();
		});

		test("toolbar is not rendered when there are no filters", async () => {
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			// No toolbar should exist without filters
			expect(
				screen.queryByRole("toolbar", { name: /applied filters/i }),
			).not.toBeInTheDocument();
		});

		test("arrow keys navigate between buttons within a single filter", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			const appliedFilter = getAppliedFilter("status");

			// Get the focusable buttons within the filter
			const operatorButton = within(appliedFilter).getByLabelText(
				"Filter relationship",
			);
			const valuesButton = within(appliedFilter).getByLabelText(/filter by/i);
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");

			// Focus the operator button (first focusable in toolbar)
			operatorButton.focus();
			expect(operatorButton).toHaveFocus();

			// Press ArrowRight - should move to values button
			await user.keyboard("{ArrowRight}");
			expect(valuesButton).toHaveFocus();

			// Press ArrowRight - should move to remove button
			await user.keyboard("{ArrowRight}");
			expect(removeButton).toHaveFocus();

			// Press ArrowLeft - should move back to values button
			await user.keyboard("{ArrowLeft}");
			expect(valuesButton).toHaveFocus();
		});

		test("arrow keys navigate across multiple filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create first filter
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create second filter
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			const firstFilter = getAppliedFilter("status");
			const secondFilter = getAppliedFilter("priority");

			// Get the remove button of first filter and operator button of second filter
			const firstFilterRemove =
				within(firstFilter).getByLabelText("Remove filter");
			const secondFilterOperator = within(secondFilter).getByLabelText(
				"Filter relationship",
			);

			// Focus the remove button of first filter
			firstFilterRemove.focus();
			expect(firstFilterRemove).toHaveFocus();

			// Press ArrowRight - should move to second filter's operator button
			await user.keyboard("{ArrowRight}");
			expect(secondFilterOperator).toHaveFocus();

			// Press ArrowLeft - should move back to first filter's remove button
			await user.keyboard("{ArrowLeft}");
			expect(firstFilterRemove).toHaveFocus();
		});

		test("Home key moves focus to first toolbar item", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create two filters
			await user.type(input, "status:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			const firstFilter = getAppliedFilter("status");
			const secondFilter = getAppliedFilter("priority");

			const firstOperator = within(firstFilter).getByLabelText(
				"Filter relationship",
			);
			const secondRemove = within(secondFilter).getByLabelText("Remove filter");

			// Focus the last button (second filter's remove button)
			secondRemove.focus();
			expect(secondRemove).toHaveFocus();

			// Press Home - should move to first toolbar item
			await user.keyboard("{Home}");
			expect(firstOperator).toHaveFocus();
		});

		test("End key moves focus to last toolbar item", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create two filters
			await user.type(input, "status:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");
			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			const firstFilter = getAppliedFilter("status");
			const secondFilter = getAppliedFilter("priority");

			const firstOperator = within(firstFilter).getByLabelText(
				"Filter relationship",
			);
			const secondRemove = within(secondFilter).getByLabelText("Remove filter");

			// Focus the first button
			firstOperator.focus();
			expect(firstOperator).toHaveFocus();

			// Press End - should move to last toolbar item
			await user.keyboard("{End}");
			expect(secondRemove).toHaveFocus();
		});

		test("arrow navigation wraps around (loops)", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create a filter
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			const appliedFilter = getAppliedFilter("status");
			const operatorButton = within(appliedFilter).getByLabelText(
				"Filter relationship",
			);
			const removeButton =
				within(appliedFilter).getByLabelText("Remove filter");

			// Focus the first button
			operatorButton.focus();
			expect(operatorButton).toHaveFocus();

			// Press ArrowLeft - should wrap to last item (remove button)
			await user.keyboard("{ArrowLeft}");
			expect(removeButton).toHaveFocus();

			// Press ArrowRight - should wrap to first item (operator button)
			await user.keyboard("{ArrowRight}");
			expect(operatorButton).toHaveFocus();
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
			const container =
				input.closest("[data-id]") || input.parentElement?.parentElement;
			const inputElement = input;
			const originalContainerGetBoundingClientRect =
				container?.getBoundingClientRect.bind(container);

			// Helper to count filters in DOM dynamically
			const getFilterCount = () =>
				document.querySelectorAll('fieldset[name$=" filter"]').length;

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
			const container =
				input.closest("[data-id]") || input.parentElement?.parentElement;
			const originalContainerGetBoundingClientRect =
				container?.getBoundingClientRect.bind(container);

			// Helper to count filters in DOM dynamically
			const getFilterCount = () =>
				document.querySelectorAll('fieldset[name$=" filter"]').length;

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

			// Remove the filter with backspace (first backspace focuses X button, second deletes)
			await act(async () => {
				await user.keyboard("{Backspace}");
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

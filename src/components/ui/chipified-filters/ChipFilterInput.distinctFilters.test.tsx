/**
 * Tests for ensuring multiple filters of the same category remain DISTINCT.
 *
 * Expected behavior: When a user applies multiple filters for the same category,
 * each filter should be a separate entity and should NOT be merged together.
 *
 * Example:
 * - User creates filter: status: "Not Started"
 * - User creates another filter: status: "In Progress"
 * - Expected: TWO separate filter chips (status: Not Started) AND (status: In Progress)
 * - NOT expected: ONE merged filter (status: Not Started, In Progress)
 */

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
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";
import { ChipFilterInput } from "./ChipFilterInput";

// Create the real test context
type TestRow = Record<string, string>;
const {
	useFilters: testUseFilters,
	filtersContext,
	filteredRowsContext,
} = createFiltersContext<TestRow>();

// Populate the holder
testContextHolder.useFilters = testUseFilters;
testContextHolder.filtersContext = filtersContext;
testContextHolder.filteredRowsContext = filteredRowsContext;

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

// Test wrapper using the real FiltersProvider
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

function ChipFilterInputWrapper() {
	return <ChipFilterInput placeholder="Filter by typing key:value..." />;
}

/**
 * Helper to find all AppliedFilters by property name.
 * Returns an array of fieldset elements.
 */
function getAllAppliedFilters(propertyName: string) {
	return Array.from(
		document.querySelectorAll(`fieldset[name="${propertyName} filter"]`),
	) as HTMLFieldSetElement[];
}

/**
 * Helper to get the first AppliedFilter (throws if not found).
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

/**
 * Helper to count total number of applied filters in the DOM
 */
function countTotalAppliedFilters() {
	return document.querySelectorAll('fieldset[name$=" filter"]').length;
}

describe("ChipFilterInput - Distinct Filters for Same Category", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Keyboard interactions - Creating multiple distinct filters", () => {
		test("creating two filters for the same category via keyboard should result in TWO separate filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Create first filter: status: Not Started
			await user.type(input, "status:");
			await user.keyboard("{Enter}"); // Select first option (Not Started)

			// Verify first filter exists
			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			const firstFilterValues = within(getAppliedFilter("status")).getByText(
				"Not Started",
			);
			expect(firstFilterValues).toBeInTheDocument();

			// Create second filter for same category: status: In Progress
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{ArrowDown}"); // Move to second option (In Progress)
			await user.keyboard("{Enter}");

			// EXPECTED: There should be TWO separate status filters
			await waitFor(() => {
				const statusFilters = getAllAppliedFilters("status");
				expect(statusFilters).toHaveLength(2);
			});

			const statusFilters = getAllAppliedFilters("status");

			// First filter should have "Not Started"
			expect(
				within(statusFilters[0]).getByText("Not Started"),
			).toBeInTheDocument();

			// Second filter should have "In Progress"
			expect(
				within(statusFilters[1]).getByText("In Progress"),
			).toBeInTheDocument();
		});

		test("creating three filters for the same category via keyboard should result in THREE separate filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter: priority: Low
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			// Create second filter: priority: Medium
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			// Create third filter: priority: High
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			// EXPECTED: THREE separate priority filters
			await waitFor(() => {
				const priorityFilters = getAllAppliedFilters("priority");
				expect(priorityFilters).toHaveLength(3);
			});

			const priorityFilters = getAllAppliedFilters("priority");
			expect(within(priorityFilters[0]).getByText("Low")).toBeInTheDocument();
			expect(
				within(priorityFilters[1]).getByText("Medium"),
			).toBeInTheDocument();
			expect(within(priorityFilters[2]).getByText("High")).toBeInTheDocument();
		});

		test("filters for different categories should remain independent", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create status filter
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create priority filter
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("priority")).toBeInTheDocument();
			});

			// Create another status filter
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			// Should have 2 status filters and 1 priority filter
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
				expect(countTotalAppliedFilters()).toBe(3);
			});
		});

		test("typing full filter text and pressing Enter should create distinct filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter by typing full text
			await user.click(input);
			await user.type(input, "status:Not Started");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create second filter by typing full text
			await user.click(input);
			await user.type(input, "status:In Progress");
			await user.keyboard("{Enter}");

			// EXPECTED: TWO separate status filters
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
			});
		});
	});

	describe("Mouse interactions - Creating multiple distinct filters", () => {
		test("clicking to select two different values for the same category should create TWO separate filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });
			await user.click(input);

			// Type to show status options
			await user.type(input, "status:");

			// Click first option (Not Started)
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");
			await user.click(options[0]);

			await waitFor(() => {
				expect(getAppliedFilter("status")).toBeInTheDocument();
			});

			// Create second filter by clicking a different option
			await user.click(input);
			await user.type(input, "status:");

			const listbox2 = screen.getByRole("listbox");
			const options2 = within(listbox2).getAllByRole("option");
			await user.click(options2[1]); // Click "In Progress"

			// EXPECTED: TWO separate status filters
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
			});
		});

		test("clicking the same value twice should create TWO separate filters with the same value", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter
			await user.click(input);
			await user.type(input, "status:");
			let listbox = screen.getByRole("listbox");
			let options = within(listbox).getAllByRole("option");
			await user.click(options[0]); // Not Started

			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(1);
			});

			// Create second filter with the SAME value
			await user.click(input);
			await user.type(input, "status:");
			listbox = screen.getByRole("listbox");
			options = within(listbox).getAllByRole("option");
			await user.click(options[0]); // Not Started again

			// EXPECTED: TWO separate status filters, both with "Not Started"
			// (User might want status IS "Not Started" AND status IS NOT "Not Started" for example)
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
			});

			const statusFilters = getAllAppliedFilters("status");
			expect(
				within(statusFilters[0]).getByText("Not Started"),
			).toBeInTheDocument();
			expect(
				within(statusFilters[1]).getByText("Not Started"),
			).toBeInTheDocument();
		});
	});

	describe("Multi-select with existing filters", () => {
		test("using multi-select (Space + Enter) should create a NEW filter, not merge with existing", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter: priority: Low (single select)
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			// Create second filter using multi-select: priority: Medium, High
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}"); // Move to Medium
			await user.keyboard(" "); // Toggle Medium
			await user.keyboard("{ArrowDown}"); // Move to High
			await user.keyboard(" "); // Toggle High
			await user.keyboard("{Enter}"); // Commit

			// EXPECTED: TWO separate priority filters
			// First: Low
			// Second: Medium, High (from multi-select)
			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			const priorityFilters = getAllAppliedFilters("priority");
			expect(within(priorityFilters[0]).getByText("Low")).toBeInTheDocument();
			expect(
				within(priorityFilters[1]).getByText("Medium, High"),
			).toBeInTheDocument();
		});

		test("multi-select on tags (checkbox type) should create distinct filters from existing", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter: tags: Bug
			await user.click(input);
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("tags")).toHaveLength(1);
			});

			// Create second filter: tags: Feature, Documentation (multi-select)
			await user.click(input);
			await user.type(input, "tags:");
			await user.keyboard("{ArrowDown}"); // Move to Feature
			await user.keyboard(" "); // Toggle Feature
			await user.keyboard("{ArrowDown}"); // Move to Documentation
			await user.keyboard(" "); // Toggle Documentation
			await user.keyboard("{Enter}"); // Commit

			// EXPECTED: TWO separate tags filters
			await waitFor(() => {
				expect(getAllAppliedFilters("tags")).toHaveLength(2);
			});

			const tagsFilters = getAllAppliedFilters("tags");
			expect(within(tagsFilters[0]).getByText("Bug")).toBeInTheDocument();
			expect(
				within(tagsFilters[1]).getByText("Feature, Documentation"),
			).toBeInTheDocument();
		});

		test("blur with pending selections should create NEW filter, not merge with existing", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first filter
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			// Start creating second filter with pending selections
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}"); // Move to Medium
			await user.keyboard(" "); // Toggle Medium (pending)

			// Blur to commit pending selections
			await user.click(document.body);

			// Wait for blur effects
			await waitFor(() => {
				expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
			});

			// EXPECTED: TWO separate priority filters
			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});
		});
	});

	describe("Edge cases - Filter distinctness", () => {
		test("creating filters via different methods should all be distinct", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Method 1: Direct Enter on highlighted option
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}"); // Low

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			// Method 2: Type full text and Enter
			await user.click(input);
			await user.type(input, "priority:Medium");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			// Method 3: Click on option
			await user.click(input);
			await user.type(input, "priority:");
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");
			await user.click(options[2]); // High

			// All three should be distinct
			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(3);
			});

			const priorityFilters = getAllAppliedFilters("priority");
			expect(within(priorityFilters[0]).getByText("Low")).toBeInTheDocument();
			expect(
				within(priorityFilters[1]).getByText("Medium"),
			).toBeInTheDocument();
			expect(within(priorityFilters[2]).getByText("High")).toBeInTheDocument();
		});

		test("removing one filter should not affect other filters of same category", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create three priority filters
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(3);
			});

			// Remove the middle filter (Medium)
			const priorityFilters = getAllAppliedFilters("priority");
			const removeButton = within(priorityFilters[1]).getByLabelText(
				"Remove filter",
			);
			await user.click(removeButton);

			// Should have 2 filters remaining: Low and High
			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			const remainingFilters = getAllAppliedFilters("priority");
			expect(within(remainingFilters[0]).getByText("Low")).toBeInTheDocument();
			expect(within(remainingFilters[1]).getByText("High")).toBeInTheDocument();
		});

		test("backspace should only remove the most recent filter, not merge anything", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create two status filters
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(1);
			});

			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
			});

			// Press backspace with empty input (first backspace focuses X button, second deletes)
			expect(input).toHaveValue("");
			await act(async () => {
				await user.keyboard("{Backspace}"); // Focus X button
				await user.keyboard("{Backspace}"); // Delete filter
			});

			// Should have 1 filter remaining (the first one)
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(1);
			});

			// The remaining filter should be the first one (Not Started)
			expect(
				within(getAppliedFilter("status")).getByText("Not Started"),
			).toBeInTheDocument();
		});
	});

	describe("Mixed category interactions", () => {
		test("alternating between categories should maintain distinct filters", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// status: Not Started
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			// priority: Low
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{Enter}");

			// status: In Progress
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			// priority: High
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			// tags: Bug
			await user.click(input);
			await user.type(input, "tags:");
			await user.keyboard("{Enter}");

			// status: Completed
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(3);
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
				expect(getAllAppliedFilters("tags")).toHaveLength(1);
				expect(countTotalAppliedFilters()).toBe(6);
			});
		});

		test("rapid filter creation should not cause merging", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Rapidly create multiple filters
			for (let i = 0; i < 4; i++) {
				await user.click(input);
				await user.type(input, "status:");
				// Navigate to different option each time (loop through)
				for (let j = 0; j < i % 4; j++) {
					await user.keyboard("{ArrowDown}");
				}
				await user.keyboard("{Enter}");
			}

			// All 4 should be distinct
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(4);
			});
		});
	});

	describe("Checkbox click behavior with existing filters", () => {
		test("clicking checkbox then label should create new filter, not merge with existing", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create first tags filter
			await user.click(input);
			await user.type(input, "tags:");
			await user.keyboard("{Enter}"); // Bug

			await waitFor(() => {
				expect(getAllAppliedFilters("tags")).toHaveLength(1);
			});

			// Create second tags filter using checkbox + label click
			await user.click(input);
			await user.type(input, "tags:");

			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");

			// Click checkbox for Feature (toggles pending)
			const featureOption = options.find((opt) =>
				opt.textContent?.includes("Feature"),
			);
			const featureCheckbox = within(featureOption!).getByRole("checkbox");
			await user.click(featureCheckbox);

			// Click label for Documentation (commits all including Feature)
			const docOption = options.find((opt) =>
				opt.textContent?.includes("Documentation"),
			);
			await user.click(docOption!);

			// Should have TWO separate tags filters
			await waitFor(() => {
				expect(getAllAppliedFilters("tags")).toHaveLength(2);
			});

			const tagsFilters = getAllAppliedFilters("tags");
			expect(within(tagsFilters[0]).getByText("Bug")).toBeInTheDocument();
			expect(
				within(tagsFilters[1]).getByText("Feature, Documentation"),
			).toBeInTheDocument();
		});
	});

	describe("Values that exist in multiple filters", () => {
		test("same value in multiple filters should be allowed and remain distinct", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create filter: status IS "Not Started"
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(1);
			});

			// Create another filter with same value: status IS "Not Started"
			// (User might change the operator on one of them)
			await user.click(input);
			await user.type(input, "status:");
			await user.keyboard("{Enter}");

			// Should have TWO distinct filters with the same value
			await waitFor(() => {
				expect(getAllAppliedFilters("status")).toHaveLength(2);
			});

			const statusFilters = getAllAppliedFilters("status");

			// Both should have "Not Started"
			expect(
				within(statusFilters[0]).getByText("Not Started"),
			).toBeInTheDocument();
			expect(
				within(statusFilters[1]).getByText("Not Started"),
			).toBeInTheDocument();

			// Verify they are different DOM elements (truly distinct)
			expect(statusFilters[0]).not.toBe(statusFilters[1]);
		});

		test("filters with overlapping values should remain distinct", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ChipFilterInputWrapper />
				</TestWrapper>,
			);

			const input = screen.getByRole("combobox", { name: /filter input/i });

			// Create filter: priority: Low, Medium
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard(" "); // Toggle Low
			await user.keyboard("{ArrowDown}");
			await user.keyboard(" "); // Toggle Medium
			await user.keyboard("{Enter}");

			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(1);
			});

			// Create overlapping filter: priority: Medium, High
			await user.click(input);
			await user.type(input, "priority:");
			await user.keyboard("{ArrowDown}"); // Medium
			await user.keyboard(" "); // Toggle Medium
			await user.keyboard("{ArrowDown}"); // High
			await user.keyboard(" "); // Toggle High
			await user.keyboard("{Enter}");

			// Should have TWO distinct filters even though they share "Medium"
			await waitFor(() => {
				expect(getAllAppliedFilters("priority")).toHaveLength(2);
			});

			const priorityFilters = getAllAppliedFilters("priority");
			expect(
				within(priorityFilters[0]).getByText("Low, Medium"),
			).toBeInTheDocument();
			expect(
				within(priorityFilters[1]).getByText("Medium, High"),
			).toBeInTheDocument();
		});
	});
});

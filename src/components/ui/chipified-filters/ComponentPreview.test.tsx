import { render, screen, within } from "@testing-library/react";
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

import { FILTER_CATEGORIES } from "@/hooks/filter-categories.mock";
// Import dependencies (these don't trigger mock because they don't use @/App directly)
import createFiltersContext, {
	FiltersProvider,
} from "@/hooks/useFilters/useFilters";

// Import the component under test
import { ComponentPreview } from "./ComponentPreview";

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

describe("ComponentPreview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("MatchTypeDropdown", () => {
		test("renders with default 'all' match type", () => {
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			// The button should show "all" as the short label
			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			expect(triggerButton).toBeInTheDocument();
			expect(triggerButton).toHaveTextContent("all");
		});

		test("opens dropdown when clicked", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			await user.click(triggerButton);

			// Dropdown should be open with full labels
			expect(
				screen.getByRole("menuitemradio", { name: /all filters must match/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			).toBeInTheDocument();
		});

		test("shows full labels in dropdown options", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			await user.click(triggerButton);

			// Both options should show full labels
			const allOption = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});

			expect(allOption).toHaveTextContent("all filters must match");
			expect(anyOption).toHaveTextContent("any filter must match");
		});

		test("'all' option is checked by default", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			await user.click(triggerButton);

			const allOption = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});

			// "all" should be checked, "any" should not
			expect(allOption).toHaveAttribute("data-state", "checked");
			expect(anyOption).toHaveAttribute("data-state", "unchecked");
		});

		test("shows checkmark next to currently selected option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			await user.click(triggerButton);

			const allOption = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});

			// Check for the checkmark indicator
			const checkmark = within(allOption).queryByTestId("checkmark-indicator");
			expect(checkmark).toBeInTheDocument();
		});

		test("selecting 'any' changes the button text to 'any'", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Initially shows "all"
			expect(triggerButton).toHaveTextContent("all");

			// Open dropdown and select "any"
			await user.click(triggerButton);
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});
			await user.click(anyOption);

			// Button should now show "any"
			expect(triggerButton).toHaveTextContent("any");
			expect(triggerButton).not.toHaveTextContent("all");
		});

		test("selecting 'any' then reopening shows 'any' as checked", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Open dropdown and select "any"
			await user.click(triggerButton);
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});
			await user.click(anyOption);

			// Reopen dropdown
			await user.click(triggerButton);

			// "any" should now be checked
			const anyOptionAfter = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});
			const allOptionAfter = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});

			expect(anyOptionAfter).toHaveAttribute("data-state", "checked");
			expect(allOptionAfter).toHaveAttribute("data-state", "unchecked");
		});

		test("can switch from 'any' back to 'all'", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Select "any"
			await user.click(triggerButton);
			await user.click(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			);

			// Verify it changed
			expect(triggerButton).toHaveTextContent("any");

			// Select "all" again
			await user.click(triggerButton);
			await user.click(
				screen.getByRole("menuitemradio", { name: /all filters must match/i }),
			);

			// Verify it changed back
			expect(triggerButton).toHaveTextContent("all");
		});

		test("dropdown closes after selecting an option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Open dropdown
			await user.click(triggerButton);
			expect(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			).toBeInTheDocument();

			// Select "any"
			await user.click(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			);

			// Dropdown should be closed
			expect(
				screen.queryByRole("menuitemradio", { name: /any filter must match/i }),
			).not.toBeInTheDocument();
		});

		test("dropdown can be closed with Escape key", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Open dropdown
			await user.click(triggerButton);
			expect(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			).toBeInTheDocument();

			// Press Escape
			await user.keyboard("{Escape}");

			// Dropdown should be closed
			expect(
				screen.queryByRole("menuitemradio", { name: /any filter must match/i }),
			).not.toBeInTheDocument();
		});

		test("keyboard navigation works in dropdown", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Open dropdown with Enter key
			triggerButton.focus();
			await user.keyboard("{Enter}");

			// The dropdown should be open
			expect(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			).toBeInTheDocument();

			// Press ArrowDown to navigate to "any" option and Enter to select
			await user.keyboard("{ArrowDown}");
			await user.keyboard("{Enter}");

			// Button should now show "any"
			expect(triggerButton).toHaveTextContent("any");
		});

		test("checkmark only appears on selected option, not on unselected", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});
			await user.click(triggerButton);

			const allOption = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});

			// "all" is selected and should have the checkmark indicator
			expect(
				within(allOption).queryByTestId("checkmark-indicator"),
			).toBeInTheDocument();

			// "any" is not selected and should NOT have the checkmark indicator
			expect(
				within(anyOption).queryByTestId("checkmark-indicator"),
			).not.toBeInTheDocument();
		});

		test("checkmark moves to newly selected option", async () => {
			const user = userEvent.setup();
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Open and select "any"
			await user.click(triggerButton);
			await user.click(
				screen.getByRole("menuitemradio", { name: /any filter must match/i }),
			);

			// Reopen dropdown
			await user.click(triggerButton);

			const allOption = screen.getByRole("menuitemradio", {
				name: /all filters must match/i,
			});
			const anyOption = screen.getByRole("menuitemradio", {
				name: /any filter must match/i,
			});

			// Now "any" should have the checkmark, "all" should not
			expect(
				within(anyOption).queryByTestId("checkmark-indicator"),
			).toBeInTheDocument();
			expect(
				within(allOption).queryByTestId("checkmark-indicator"),
			).not.toBeInTheDocument();
		});
	});

	describe("Layout", () => {
		test("renders ChipFilterInput alongside match type dropdown", () => {
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			// Both components should be present
			expect(
				screen.getByRole("combobox", { name: /filter input/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /filter match mode/i }),
			).toBeInTheDocument();
		});

		test("filter input and match type dropdown are both rendered", () => {
			render(
				<TestWrapper>
					<ComponentPreview />
				</TestWrapper>,
			);

			const filterInput = screen.getByRole("combobox", {
				name: /filter input/i,
			});
			const matchTypeButton = screen.getByRole("button", {
				name: /filter match mode/i,
			});

			// Both elements should be in the document
			expect(filterInput).toBeInTheDocument();
			expect(matchTypeButton).toBeInTheDocument();
		});
	});
});

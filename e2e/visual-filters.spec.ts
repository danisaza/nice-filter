import { expect, test } from "@playwright/test";

/**
 * Visual regression tests for filter components.
 *
 * These tests capture screenshot baselines for various component states
 * to detect unintended visual changes during refactoring.
 *
 * Run `npx playwright test --update-snapshots` to generate/update baselines.
 */
test.describe("Visual Regression: Filter Components", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for the app to fully load
		await expect(page.locator("#chip-filter-container")).toBeVisible();
	});

	// ============================================
	// ChipFilterInput - Empty/Default States
	// ============================================
	test.describe("ChipFilterInput - Empty States", () => {
		test("empty filter input with search icon", async ({ page }) => {
			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toBeVisible();

			await expect(filterInput).toHaveScreenshot("filter-input-empty.png");
		});

		test("filter input focused without typing", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.focus();

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot("filter-input-focused.png");
		});
	});

	// ============================================
	// ChipFilterInput - Autocomplete Dropdown
	// ============================================
	test.describe("ChipFilterInput - Autocomplete Dropdown", () => {
		test("autocomplete dropdown showing filter keys", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("sta");

			// Wait for dropdown to appear
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"autocomplete-dropdown-keys.png",
			);
		});

		test("autocomplete dropdown showing filter values", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status:");

			// Wait for value suggestions
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"autocomplete-dropdown-values.png",
			);
		});

		test("autocomplete with highlighted item (keyboard navigation)", async ({
			page,
		}) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status:");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			// Navigate down to highlight second item
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("ArrowDown");

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"autocomplete-highlighted-item.png",
			);
		});

		test("autocomplete with multi-select checkboxes", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("tags:");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			// Use Space to toggle selection on first item
			await page.keyboard.press("Space");
			// Navigate down and toggle another
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("Space");

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"autocomplete-multi-select-checked.png",
			);
		});
	});

	// ============================================
	// ChipFilterInput - Natural Language Mode
	// ============================================
	test.describe("ChipFilterInput - Natural Language Mode", () => {
		test("natural language mode with magic wand icon", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			// Type something that doesn't match any filter key
			await input.fill("show me completed tasks");

			// Wait for magic wand icon to appear
			await expect(page.getByTestId("magic-wand-icon")).toBeVisible();

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"filter-input-natural-language-mode.png",
			);
		});
	});

	// ============================================
	// AppliedFilter Chip Variations
	// ============================================
	test.describe("AppliedFilter - Single Value Chips", () => {
		test("single filter chip (status)", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for value dropdown
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter"); // Select first value

			// Wait for filter chip to appear with increased timeout
			const filterChip = page.locator('fieldset[name="status filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			await expect(filterChip).toHaveScreenshot(
				"applied-filter-chip-status.png",
			);
		});

		test("single filter chip (priority)", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("priority");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for value dropdown
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter"); // Select first value

			const filterChip = page.locator('fieldset[name="priority filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			await expect(filterChip).toHaveScreenshot(
				"applied-filter-chip-priority.png",
			);
		});

		test("single filter chip (assignee)", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("assignee");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for value dropdown
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter"); // Select first value

			const filterChip = page.locator('fieldset[name="assignee filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			await expect(filterChip).toHaveScreenshot(
				"applied-filter-chip-assignee.png",
			);
		});
	});

	test.describe("AppliedFilter - Multi-Value Chips", () => {
		test("multi-value filter chip (tags with multiple selections)", async ({
			page,
		}) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("tags:");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			// Select multiple values using Space
			await page.keyboard.press("Space"); // Select first
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("Space"); // Select second
			await page.keyboard.press("Enter"); // Commit

			const filterChip = page.locator('fieldset[name="tags filter"]');
			await expect(filterChip).toBeVisible();

			await expect(filterChip).toHaveScreenshot(
				"applied-filter-chip-multi-value.png",
			);
		});
	});

	test.describe("AppliedFilter - Chip Interactions", () => {
		test("filter chip with operator dropdown open", async ({ page }) => {
			// First add a filter
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for filter chip
			const filterChip = page.locator('fieldset[name="status filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			// Click on the operator button to open dropdown
			const operatorButton = filterChip.getByRole("button", {
				name: "Filter relationship",
			});
			await operatorButton.click();

			// Wait for dropdown to open
			await expect(page.getByRole("menu")).toBeVisible();

			// Screenshot the whole filter area to capture dropdown
			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"filter-chip-operator-dropdown-open.png",
			);
		});

		test("filter chip with value dropdown open", async ({ page }) => {
			// First add a filter
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for filter chip
			const filterChip = page.locator('fieldset[name="status filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			// Click on the value button to open dropdown
			const valueButton = filterChip.getByRole("button", {
				name: /Filter by status/,
			});
			await valueButton.click();

			// Wait for dropdown content to appear
			await expect(
				page.locator('[role="menuitemcheckbox"]').first(),
			).toBeVisible();

			// Screenshot the whole filter area
			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"filter-chip-value-dropdown-open.png",
			);
		});

		test("filter chip remove button hover state", async ({ page }) => {
			// Add a filter
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			const filterChip = page.locator('fieldset[name="status filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			// Hover on remove button
			const removeButton = filterChip.getByRole("button", {
				name: "Remove filter",
			});
			await removeButton.hover();

			await expect(filterChip).toHaveScreenshot(
				"filter-chip-remove-button-hover.png",
			);
		});

		test("filter chip remove button focused", async ({ page }) => {
			// Add a filter
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("status");

			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			const filterChip = page.locator('fieldset[name="status filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			// Focus remove button via keyboard
			const removeButton = filterChip.getByRole("button", {
				name: "Remove filter",
			});
			await removeButton.focus();

			await expect(filterChip).toHaveScreenshot(
				"filter-chip-remove-button-focused.png",
			);
		});
	});

	// ============================================
	// DraftTextFilter
	// ============================================
	test.describe("DraftTextFilter", () => {
		test("draft text filter initial state", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("text");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for draft filter to appear
			const draftFilter = page.locator('fieldset[name="text filter"]');
			await expect(draftFilter).toBeVisible({ timeout: 10000 });

			await expect(draftFilter).toHaveScreenshot("draft-text-filter-empty.png");
		});

		test("draft text filter with typed text", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("text");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for draft filter and type some text
			const draftFilter = page.locator('fieldset[name="text filter"]');
			await expect(draftFilter).toBeVisible({ timeout: 10000 });

			// The draft filter input should be auto-focused
			await page.keyboard.type("hello world");

			await expect(draftFilter).toHaveScreenshot(
				"draft-text-filter-with-text.png",
			);
		});

		test("draft text filter operator dropdown open", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("text");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			const draftFilter = page.locator('fieldset[name="text filter"]');
			await expect(draftFilter).toBeVisible({ timeout: 10000 });

			// Click on operator button
			const operatorButton = draftFilter.getByRole("button", {
				name: "Filter relationship",
			});
			await operatorButton.click();

			// Wait for dropdown
			await expect(page.getByRole("menu")).toBeVisible();

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"draft-text-filter-operator-dropdown.png",
			);
		});
	});

	// ============================================
	// Committed Text Filter
	// ============================================
	test.describe("Committed Text Filter", () => {
		test("committed text filter chip", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("text");

			// Wait for key dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");

			// Wait for draft filter to appear first
			const draftFilter = page.locator('fieldset[name="text filter"]');
			await expect(draftFilter).toBeVisible({ timeout: 10000 });

			// Type text and commit
			await page.keyboard.type("search term");
			await page.keyboard.press("Enter");

			// Wait for committed filter - it should still be visible (not removed)
			const filterChip = page.locator('fieldset[name="text filter"]');
			await expect(filterChip).toBeVisible({ timeout: 10000 });

			// Wait a moment for any animations to settle
			await page.waitForTimeout(100);

			await expect(filterChip).toHaveScreenshot(
				"committed-text-filter-chip.png",
			);
		});
	});

	// ============================================
	// Multiple Filters
	// ============================================
	test.describe("Multiple Filters", () => {
		test("multiple filter chips in input", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			const listbox = page.getByRole("listbox");

			// Add status filter
			await input.click();
			await input.fill("status");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(page.locator('fieldset[name="status filter"]')).toBeVisible({
				timeout: 10000,
			});

			// Add priority filter
			await input.fill("priority");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(
				page.locator('fieldset[name="priority filter"]'),
			).toBeVisible({ timeout: 10000 });

			// Add assignee filter
			await input.fill("assignee");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(
				page.locator('fieldset[name="assignee filter"]'),
			).toBeVisible({ timeout: 10000 });

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot("multiple-filter-chips.png");
		});

		test("multiple filters with wrapping", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			const listbox = page.getByRole("listbox");

			// Add many filters to force wrapping
			const filterTypes = ["status", "priority", "assignee", "tags"];
			for (const filterType of filterTypes) {
				await input.click();
				await input.fill(filterType);
				await expect(listbox).toBeVisible();
				await page.keyboard.press("Enter");
				await expect(listbox).toBeVisible();
				await page.keyboard.press("Enter");
				// Wait for each filter chip to appear
				await expect(
					page.locator(`fieldset[name="${filterType} filter"]`).first(),
				).toBeVisible({ timeout: 10000 });
			}

			// Add a second status filter
			await input.click();
			await input.fill("status");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("ArrowDown");
			await page.keyboard.press("Enter");

			// Wait for second status filter
			const statusFilters = page.locator('fieldset[name="status filter"]');
			await expect(statusFilters.nth(1)).toBeVisible({ timeout: 10000 });

			const filterInput = page.locator("#chip-filter-input-wrapper");
			await expect(filterInput).toHaveScreenshot(
				"multiple-filters-wrapping.png",
			);
		});
	});

	// ============================================
	// MatchTypeDropdown
	// ============================================
	test.describe("MatchTypeDropdown", () => {
		test("match type dropdown closed (default 'all')", async ({ page }) => {
			const matchTypeButton = page.getByRole("button", {
				name: "Filter match mode",
			});
			await expect(matchTypeButton).toBeVisible();

			await expect(matchTypeButton).toHaveScreenshot(
				"match-type-dropdown-closed.png",
			);
		});

		test("match type dropdown open", async ({ page }) => {
			const matchTypeButton = page.getByRole("button", {
				name: "Filter match mode",
			});
			await matchTypeButton.click();

			// Wait for dropdown
			const dropdown = page.locator('[role="menu"]');
			await expect(dropdown).toBeVisible();

			await expect(dropdown).toHaveScreenshot("match-type-dropdown-open.png");
		});

		test("match type dropdown with 'any' selected", async ({ page }) => {
			const matchTypeButton = page.getByRole("button", {
				name: "Filter match mode",
			});
			await matchTypeButton.click();

			// Select 'any'
			const anyOption = page.getByRole("menuitemradio", {
				name: "any filter must match",
			});
			await anyOption.click();

			// Click again to open and show the selection
			await matchTypeButton.click();
			const dropdown = page.locator('[role="menu"]');
			await expect(dropdown).toBeVisible();

			await expect(dropdown).toHaveScreenshot(
				"match-type-dropdown-any-selected.png",
			);
		});
	});

	// ============================================
	// Full Component Layout
	// ============================================
	test.describe("Full Header Layout", () => {
		test("header with empty filters", async ({ page }) => {
			const header = page.locator("header");
			await expect(header).toBeVisible();

			await expect(header).toHaveScreenshot("header-empty-filters.png");
		});

		test("header with multiple filters applied", async ({ page }) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			const listbox = page.getByRole("listbox");

			// Add some filters
			await input.click();
			await input.fill("status");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(page.locator('fieldset[name="status filter"]')).toBeVisible({
				timeout: 10000,
			});

			await input.fill("priority");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(
				page.locator('fieldset[name="priority filter"]'),
			).toBeVisible({ timeout: 10000 });

			const header = page.locator("header");
			await expect(header).toHaveScreenshot("header-with-filters.png");
		});

		test("header with filter input focused and dropdown visible", async ({
			page,
		}) => {
			const input = page.getByRole("combobox", { name: "Filter input" });
			await input.click();
			await input.fill("sta");

			// Wait for dropdown
			const listbox = page.getByRole("listbox");
			await expect(listbox).toBeVisible();

			const header = page.locator("header");
			await expect(header).toHaveScreenshot("header-with-dropdown.png");
		});
	});
});

/**
 * Visual regression tests for filter chip edge cases and states.
 */
test.describe("Visual Regression: Edge Cases", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#chip-filter-container")).toBeVisible();
	});

	test("long value text truncation in chip", async ({ page }) => {
		const input = page.getByRole("combobox", { name: "Filter input" });
		await input.click();
		await input.fill("text");

		// Wait for key dropdown
		const listbox = page.getByRole("listbox");
		await expect(listbox).toBeVisible();
		await page.keyboard.press("Enter");

		// Wait for draft filter to appear
		const draftFilter = page.locator('fieldset[name="text filter"]');
		await expect(draftFilter).toBeVisible({ timeout: 10000 });

		// Type a very long text
		await page.keyboard.type(
			"this is a very long search term that should be truncated in the chip display",
		);
		await page.keyboard.press("Enter");

		const filterChip = page.locator('fieldset[name="text filter"]');
		await expect(filterChip).toBeVisible({ timeout: 10000 });

		// Wait a moment for any animations to settle
		await page.waitForTimeout(100);

		await expect(filterChip).toHaveScreenshot("filter-chip-long-text.png");
	});

	test("filter chip with special characters in value", async ({ page }) => {
		const input = page.getByRole("combobox", { name: "Filter input" });
		await input.click();
		await input.fill("text");

		// Wait for key dropdown
		const listbox = page.getByRole("listbox");
		await expect(listbox).toBeVisible();
		await page.keyboard.press("Enter");

		// Wait for draft filter to appear
		const draftFilter = page.locator('fieldset[name="text filter"]');
		await expect(draftFilter).toBeVisible({ timeout: 10000 });

		// Type text with special characters
		await page.keyboard.type("test <script> & 'quotes' \"double\"");
		await page.keyboard.press("Enter");

		const filterChip = page.locator('fieldset[name="text filter"]');
		await expect(filterChip).toBeVisible({ timeout: 10000 });

		// Wait a moment for any animations to settle
		await page.waitForTimeout(100);

		await expect(filterChip).toHaveScreenshot(
			"filter-chip-special-characters.png",
		);
	});

	test("filter input with many chips causing scroll", async ({ page }) => {
		const input = page.getByRole("combobox", { name: "Filter input" });
		const listbox = page.getByRole("listbox");

		// Add many filters
		const filterTypes = ["status", "priority", "assignee", "tags"];
		for (let i = 0; i < 8; i++) {
			await input.click();
			const filterType = filterTypes[i % filterTypes.length];
			await input.fill(filterType);
			await expect(listbox).toBeVisible();
			await page.keyboard.press("Enter");
			await expect(listbox).toBeVisible();
			// Navigate to different values to create distinct filters
			for (let j = 0; j < i % 4; j++) {
				await page.keyboard.press("ArrowDown");
			}
			await page.keyboard.press("Enter");
			// Wait for filter chip to appear
			await page.waitForTimeout(100);
		}

		const filterInput = page.locator("#chip-filter-input-wrapper");
		await expect(filterInput).toHaveScreenshot("filter-input-many-chips.png");
	});
});

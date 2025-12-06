import { expect, test } from "@playwright/test";

/**
 * E2E test for the natural language AI mode feature.
 *
 * This test runs without mocking - it hits the real /api/parse-filters endpoint
 * which calls OpenAI to parse natural language into structured filters.
 *
 * Prerequisites:
 * - OPENAI_API_KEY must be set in environment
 * - Dev server must be running (handled by playwright.config.ts webServer)
 */
test.describe("Natural Language AI Mode", () => {
	test("user types natural language query and filter chip appears", async ({
		page,
	}) => {
		// Step 1: Navigate to the app
		await page.goto("/");

		// Step 2: Verify the page loads and the filter input is visible
		const filterInput = page.getByRole("combobox", { name: "Filter input" });
		await expect(filterInput).toBeVisible();

		// Step 3: Verify no filters exist initially
		const toolbar = page.getByRole("toolbar", { name: "Applied filters" });
		await expect(toolbar).not.toBeVisible();

		// Step 4: Click on the filter input to focus it
		await filterInput.click();
		await expect(filterInput).toBeFocused();

		// Step 5: Verify the dropdown appears (autocomplete suggestions)
		// When empty input is focused, it should show key suggestions
		const dropdown = page.getByRole("listbox");
		await expect(dropdown).toBeVisible();

		// Step 6: Type the natural language query
		// This should trigger "natural language mode" since "the" is not a valid column prefix
		await filterInput.fill("the status is either in progress or completed");

		// Step 7: Verify we're in natural language mode
		// The dropdown should be hidden (no autocomplete in NL mode)
		// The MagicWand icon should appear (purple color)
		await expect(dropdown).not.toBeVisible();

		// Verify the magic wand icon is visible (indicates NL mode)
		const magicWandIcon = page.locator("svg.text-purple-500");
		await expect(magicWandIcon).toBeVisible();

		// Step 8: Verify the input contains our query
		await expect(filterInput).toHaveValue(
			"the status is either in progress or completed",
		);

		// Step 9: Press Enter to submit the natural language query
		// This triggers the AI parsing endpoint
		await filterInput.press("Enter");

		// Step 10: Verify loading state appears
		// A spinner should show while the AI is processing
		const spinner = page.locator(".animate-spin");
		await expect(spinner).toBeVisible();

		// Step 11: Wait for the API response and filter chip to appear
		// The AI should parse "in progress or completed" and create a status filter
		// Using a longer timeout since AI calls can take a few seconds
		const statusFilterChip = page.locator('fieldset[name="status filter"]');
		await expect(statusFilterChip).toBeVisible({ timeout: 30000 });

		// Step 12: Verify the spinner is gone
		await expect(spinner).not.toBeVisible();

		// Step 13: Verify the input is cleared after successful submission
		await expect(filterInput).toHaveValue("");

		// Step 14: Verify the filter chip shows the correct structure
		// Should have: "status" (property name), "is any of" (operator for multiple values), "In Progress, Completed" (values)

		// Verify the property name
		const propertyName = statusFilterChip.locator("span").first();
		await expect(propertyName).toHaveText("status");

		// Verify the operator button shows "is any of" (since we have 2 values)
		const operatorButton = statusFilterChip.getByRole("button", {
			name: "Filter relationship",
		});
		await expect(operatorButton).toHaveText("is any of");

		// Verify the values are displayed
		// The AI might return values in any order, so we check for both being present
		const valuesButton = statusFilterChip.getByRole("button", {
			name: "Filter by status",
		});

		// Get the text content of the values button
		const valuesText = await valuesButton.textContent();
		expect(valuesText).toBeTruthy();

		// Check that both "In Progress" and "Completed" are in the values
		// The order might vary based on AI response
		expect(valuesText).toMatch(/In Progress/);
		expect(valuesText).toMatch(/Completed/);

		// Step 15: Verify the toolbar is now visible (since we have a filter)
		await expect(toolbar).toBeVisible();

		// Step 16: Verify there's only one filter chip (not duplicates)
		const allStatusFilters = page.locator('fieldset[name="status filter"]');
		await expect(allStatusFilters).toHaveCount(1);

		// Step 17: Verify the remove button is present
		const removeButton = statusFilterChip.getByRole("button", {
			name: "Remove filter",
		});
		await expect(removeButton).toBeVisible();

		// Step 18: Verify the filter is functional by checking it can be removed
		await removeButton.click();
		await expect(statusFilterChip).not.toBeVisible();

		// Toolbar should be hidden again
		await expect(toolbar).not.toBeVisible();
	});

	test("shows loading spinner while AI is processing and creates correct filters", async ({
		page,
	}) => {
		await page.goto("/");

		const filterInput = page.getByRole("combobox", { name: "Filter input" });
		await filterInput.click();
		await filterInput.fill("show me high priority bugs");
		await filterInput.press("Enter");

		// Verify loading state
		const spinner = page.locator(".animate-spin");
		await expect(spinner).toBeVisible();

		// Wait for completion
		await expect(spinner).not.toBeVisible({ timeout: 30000 });

		// Verify the tags filter chip appears with "include" and "Bug"
		const tagsFilterChip = page.locator('fieldset[name="tags filter"]');
		await expect(tagsFilterChip).toBeVisible();

		// Verify tags filter shows "include" operator
		const tagsOperatorButton = tagsFilterChip.getByRole("button", {
			name: "Filter relationship",
		});
		await expect(tagsOperatorButton).toHaveText("include");

		// Verify tags filter shows "Bug" value
		const tagsValuesButton = tagsFilterChip.getByRole("button", {
			name: "Filter by tags",
		});
		await expect(tagsValuesButton).toHaveText("Bug");

		// Verify the priority filter chip appears with "is" and "High"
		const priorityFilterChip = page.locator('fieldset[name="priority filter"]');
		await expect(priorityFilterChip).toBeVisible();

		// Verify priority filter shows "is" operator
		const priorityOperatorButton = priorityFilterChip.getByRole("button", {
			name: "Filter relationship",
		});
		await expect(priorityOperatorButton).toHaveText("is");

		// Verify priority filter shows "High" value
		const priorityValuesButton = priorityFilterChip.getByRole("button", {
			name: "Filter by priority",
		});
		await expect(priorityValuesButton).toHaveText("High");

		// Verify we have exactly 2 filters
		const allFilterChips = page.locator("fieldset[name$=' filter']");
		await expect(allFilterChips).toHaveCount(2);
	});

	test("input is disabled while AI is processing", async ({ page }) => {
		await page.goto("/");

		const filterInput = page.getByRole("combobox", { name: "Filter input" });
		await filterInput.click();
		await filterInput.fill("tasks assigned to john doe");

		// Submit
		await filterInput.press("Enter");

		// Input should be disabled while processing
		await expect(filterInput).toBeDisabled();

		// Wait for completion
		await expect(filterInput).toBeEnabled({ timeout: 30000 });
	});
});

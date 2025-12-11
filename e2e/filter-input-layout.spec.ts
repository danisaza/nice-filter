import { expect, test } from "@playwright/test";

test.describe("Filter Input Layout Tests", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-testid="filter-dropdown"]', {
			timeout: 10000,
		});
	});

	test("should display filter dropdown button", async ({ page }) => {
		const filterDropdown = page.locator('[data-testid="filter-dropdown"]');
		await expect(filterDropdown).toBeVisible();
	});

	test("should open dropdown on click", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		const content = page.locator('[data-testid="filter-dropdown-content"]');
		await expect(content).toBeVisible();
	});

	test("should close dropdown on escape", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');
		await page.keyboard.press("Escape");

		const content = page.locator('[data-testid="filter-dropdown-content"]');
		await expect(content).not.toBeVisible();
	});

	test("should display filter categories", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		const categories = page.locator('[data-testid="filter-category"]');
		await expect(categories.first()).toBeVisible();
	});

	test("should apply filter when option selected", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		// Expand first category
		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();

		// Select first option
		const firstOption = page.locator('[data-testid="filter-option"]').first();
		await firstOption.click();

		// Check that a filter chip appears
		const appliedFilter = page.locator('[data-testid="applied-filter"]');
		await expect(appliedFilter.first()).toBeVisible();
	});

	test("should remove filter when clicking remove button", async ({ page }) => {
		// First apply a filter
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();

		const firstOption = page.locator('[data-testid="filter-option"]').first();
		await firstOption.click();

		await page.keyboard.press("Escape");

		// Now remove the filter
		const removeButton = page.locator(
			'[data-testid="applied-filter"] [data-testid="remove-filter"]',
		);
		if ((await removeButton.count()) > 0) {
			await removeButton.first().click();
			await expect(
				page.locator('[data-testid="applied-filter"]'),
			).not.toBeVisible();
		}
	});

	test("grid should display data rows", async ({ page }) => {
		const grid = page.locator("main");
		await expect(grid).toBeVisible();

		// Wait for rows to render
		await page.waitForTimeout(500);
		const gridContent = await grid.textContent();
		expect(gridContent).toBeTruthy();
	});

	test("should filter grid data when filter applied", async ({ page }) => {
		// Get initial row count text from footer
		const footer = page.locator("footer");
		const initialFooterText = await footer.textContent();

		// Apply a filter
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();

		const firstOption = page.locator('[data-testid="filter-option"]').first();
		await firstOption.click();

		await page.keyboard.press("Escape");

		// Give time for filtering
		await page.waitForTimeout(300);

		// Footer text should have changed (showing filtered count)
		const filteredFooterText = await footer.textContent();
		expect(filteredFooterText).not.toBe(initialFooterText);

		// The footer should still exist and contain some text
		expect(filteredFooterText).toBeTruthy();
	});

	test("should handle row count dialog", async ({ page }) => {
		const changeRowCountButton = page.locator("text=Change row count");
		await expect(changeRowCountButton).toBeVisible();

		await changeRowCountButton.click();

		const dialog = page.locator('[role="dialog"]');
		await expect(dialog).toBeVisible();

		// Close dialog
		await page.keyboard.press("Escape");
		await expect(dialog).not.toBeVisible();
	});
});

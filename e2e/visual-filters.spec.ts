import { expect, test } from "@playwright/test";

test.describe("Visual Filter Tests", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		// Wait for app to fully load
		await page.waitForSelector('[data-testid="filter-dropdown"]', {
			timeout: 10000,
		});
	});

	test("initial page load - no filters applied", async ({ page }) => {
		await expect(page.locator("header")).toHaveScreenshot(
			"initial-header-no-filters.png",
		);
	});

	test("filter dropdown open state", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		await expect(
			page.locator('[data-testid="filter-dropdown-content"]'),
		).toHaveScreenshot("filter-dropdown-open.png");
	});

	test("filter category expanded", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		// Click first category to expand it
		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();

		await expect(
			page.locator('[data-testid="filter-dropdown-content"]'),
		).toHaveScreenshot("filter-category-expanded.png");
	});

	test("applied filter chip", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		// Click first category then first option
		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();

		const firstOption = page.locator('[data-testid="filter-option"]').first();
		await firstOption.click();

		// Close dropdown and check applied filter
		await page.keyboard.press("Escape");
		await expect(page.locator("header")).toHaveScreenshot(
			"applied-filter-chip.png",
		);
	});

	test("multiple applied filters", async ({ page }) => {
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		// Apply multiple filters
		const categories = page.locator('[data-testid="filter-category"]');
		const categoryCount = await categories.count();

		if (categoryCount >= 2) {
			// First category
			await categories.first().click();
			await page.locator('[data-testid="filter-option"]').first().click();

			// Second category
			await categories.nth(1).click();
			await page.locator('[data-testid="filter-option"]').first().click();
		}

		await page.keyboard.press("Escape");
		await expect(page.locator("header")).toHaveScreenshot(
			"multiple-filters-applied.png",
		);
	});

	test("match type switcher states", async ({ page }) => {
		// First apply some filters so the switcher is visible
		await page.click('[data-testid="filter-dropdown"]');
		await page.waitForSelector('[data-testid="filter-dropdown-content"]');

		const firstCategory = page
			.locator('[data-testid="filter-category"]')
			.first();
		await firstCategory.click();
		await page.locator('[data-testid="filter-option"]').first().click();
		await page.keyboard.press("Escape");

		// Screenshot the match type switcher
		const matchTypeSwitcher = page.locator('[data-testid="match-type-switcher"]');
		if ((await matchTypeSwitcher.count()) > 0) {
			await expect(matchTypeSwitcher).toHaveScreenshot(
				"match-type-switcher.png",
			);
		}
	});
});

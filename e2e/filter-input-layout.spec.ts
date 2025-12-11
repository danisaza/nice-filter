import { expect, test } from "@playwright/test";

/**
 * E2E tests for filter input layout and visual appearance.
 *
 * These tests verify pixel-level layout behavior that can't be tested
 * in jsdom (which doesn't compute actual CSS layouts).
 */
test.describe("Filter input layout", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	/**
	 * Verifies that items inside the filter input are vertically centered.
	 */
	test("search icon should be vertically centered in the filter input", async ({
		page,
	}) => {
		const fieldset = page.locator("#chip-filter-container");
		const searchIcon = page.getByTestId("search-icon");

		// Wait for elements to be visible
		await expect(fieldset).toBeVisible();
		await expect(searchIcon).toBeVisible();

		// Get bounding boxes
		const fieldsetBox = await fieldset.boundingBox();
		const iconBox = await searchIcon.boundingBox();

		expect(fieldsetBox).not.toBeNull();
		expect(iconBox).not.toBeNull();

		if (!fieldsetBox || !iconBox) {
			// this appeases typescript, which isn't smart enough to understand the `.not.toBeNull()` checks
			throw new Error("Failed to get bounding boxes");
		}

		// Calculate centers
		const fieldsetStyle = await fieldset.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				paddingTop: parseFloat(style.paddingTop),
				paddingBottom: parseFloat(style.paddingBottom),
				borderTopWidth: parseFloat(style.borderTopWidth),
				borderBottomWidth: parseFloat(style.borderBottomWidth),
			};
		});

		// Calculate the content area (excluding border and padding)
		const contentTop =
			fieldsetBox.y + fieldsetStyle.borderTopWidth + fieldsetStyle.paddingTop;
		const contentBottom =
			fieldsetBox.y +
			fieldsetBox.height -
			fieldsetStyle.borderBottomWidth -
			fieldsetStyle.paddingBottom;
		const contentCenter = (contentTop + contentBottom) / 2;

		// Calculate the icon's center
		const iconCenter = iconBox.y + iconBox.height / 2;

		// The icon should be centered within 1px tolerance (for sub-pixel rendering)
		const offset = Math.abs(iconCenter - contentCenter);
		expect(offset).toBeLessThanOrEqual(1);
	});

	test("input should be vertically centered in the filter input", async ({
		page,
	}) => {
		const fieldset = page.locator("#chip-filter-container");
		const input = page.getByRole("combobox", { name: "Filter input" });

		await expect(fieldset).toBeVisible();
		await expect(input).toBeVisible();

		const fieldsetBox = await fieldset.boundingBox();
		const inputBox = await input.boundingBox();

		expect(fieldsetBox).not.toBeNull();
		expect(inputBox).not.toBeNull();

		if (!fieldsetBox || !inputBox) {
			// this appeases typescript, which isn't smart enough to understand the `.not.toBeNull()` checks
			throw new Error("Failed to get bounding boxes");
		}

		const fieldsetStyle = await fieldset.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				paddingTop: parseFloat(style.paddingTop),
				paddingBottom: parseFloat(style.paddingBottom),
				borderTopWidth: parseFloat(style.borderTopWidth),
				borderBottomWidth: parseFloat(style.borderBottomWidth),
			};
		});

		const contentTop =
			fieldsetBox.y + fieldsetStyle.borderTopWidth + fieldsetStyle.paddingTop;
		const contentBottom =
			fieldsetBox.y +
			fieldsetBox.height -
			fieldsetStyle.borderBottomWidth -
			fieldsetStyle.paddingBottom;
		const contentCenter = (contentTop + contentBottom) / 2;

		const inputCenter = inputBox.y + inputBox.height / 2;

		const offset = Math.abs(inputCenter - contentCenter);
		expect(offset).toBeLessThanOrEqual(1);
	});

	test("filter chips should be vertically centered when present", async ({
		page,
	}) => {
		const fieldset = page.locator("#chip-filter-container");
		const input = page.getByRole("combobox", { name: "Filter input" });

		await expect(fieldset).toBeVisible();
		await input.click();

		// Type "status" and select it
		await input.fill("status");
		await page.keyboard.press("Enter");

		// Select a value
		await page.keyboard.press("Enter");

		// Wait for the filter chip to appear
		const filterChip = page.locator('fieldset[name="status filter"]');
		await expect(filterChip).toBeVisible();

		// Get bounding boxes
		const fieldsetBox = await fieldset.boundingBox();
		const chipBox = await filterChip.boundingBox();

		expect(fieldsetBox).not.toBeNull();
		expect(chipBox).not.toBeNull();

		if (!fieldsetBox || !chipBox) {
			// this appeases typescript, which isn't smart enough to understand the `.not.toBeNull()` checks
			throw new Error("Failed to get bounding boxes");
		}

		const fieldsetStyle = await fieldset.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				paddingTop: parseFloat(style.paddingTop),
				paddingBottom: parseFloat(style.paddingBottom),
				borderTopWidth: parseFloat(style.borderTopWidth),
				borderBottomWidth: parseFloat(style.borderBottomWidth),
			};
		});

		const contentTop =
			fieldsetBox.y + fieldsetStyle.borderTopWidth + fieldsetStyle.paddingTop;
		const contentBottom =
			fieldsetBox.y +
			fieldsetBox.height -
			fieldsetStyle.borderBottomWidth -
			fieldsetStyle.paddingBottom;
		const contentCenter = (contentTop + contentBottom) / 2;

		const chipCenter = chipBox.y + chipBox.height / 2;

		const offset = Math.abs(chipCenter - contentCenter);
		expect(offset).toBeLessThanOrEqual(1);
	});

	test("container height should not change when adding a filter", async ({
		page,
	}) => {
		const fieldset = page.locator("#chip-filter-container");
		const input = page.getByRole("combobox", { name: "Filter input" });

		await expect(fieldset).toBeVisible();

		// Get initial height
		const initialBox = await fieldset.boundingBox();
		expect(initialBox).not.toBeNull();
		if (!initialBox) throw new Error("Failed to get initial bounding box");
		const initialHeight = initialBox.height;

		// Add a filter - click and wait for dropdown
		await input.click();
		await input.fill("status");

		// Wait for dropdown to appear before pressing Enter
		const listbox = page.getByRole("listbox");
		await expect(listbox).toBeVisible();

		// Select the key
		await page.keyboard.press("Enter");

		// Wait for value dropdown to appear
		await expect(listbox).toBeVisible();

		// Select the value
		await page.keyboard.press("Enter");

		// Wait for filter chip to appear
		const filterChip = page.locator('fieldset[name="status filter"]');
		await expect(filterChip).toBeVisible();

		// Get height after adding filter
		const afterBox = await fieldset.boundingBox();
		expect(afterBox).not.toBeNull();
		if (!afterBox) throw new Error("Failed to get bounding box after filter");

		// Height should remain the same (within 1px for sub-pixel rendering)
		expect(Math.abs(afterBox.height - initialHeight)).toBeLessThanOrEqual(1);
	});

	test("draft text filter should have same height as container content area", async ({
		page,
	}) => {
		const fieldset = page.locator("#chip-filter-container");
		const input = page.getByRole("combobox", { name: "Filter input" });

		await expect(fieldset).toBeVisible();

		// Get initial height
		const initialBox = await fieldset.boundingBox();
		expect(initialBox).not.toBeNull();
		if (!initialBox) throw new Error("Failed to get initial bounding box");
		const initialHeight = initialBox.height;

		// Add a text filter (creates a draft) - wait for dropdown first
		await input.click();
		await input.fill("text");

		// Wait for dropdown to appear before pressing Enter
		const listbox = page.getByRole("listbox");
		await expect(listbox).toBeVisible();

		await page.keyboard.press("Enter");

		// Wait for draft text filter to appear
		const draftFilter = page.locator('fieldset[name="text filter"]');
		await expect(draftFilter).toBeVisible();

		// Get height after adding draft filter
		const afterBox = await fieldset.boundingBox();
		expect(afterBox).not.toBeNull();
		if (!afterBox) throw new Error("Failed to get bounding box after filter");

		// Height should remain the same (within 1px for sub-pixel rendering)
		expect(Math.abs(afterBox.height - initialHeight)).toBeLessThanOrEqual(1);

		// Also verify the draft filter is vertically centered
		const draftBox = await draftFilter.boundingBox();
		expect(draftBox).not.toBeNull();
		if (!draftBox) throw new Error("Failed to get draft filter bounding box");

		const fieldsetStyle = await fieldset.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				paddingTop: parseFloat(style.paddingTop),
				paddingBottom: parseFloat(style.paddingBottom),
				borderTopWidth: parseFloat(style.borderTopWidth),
				borderBottomWidth: parseFloat(style.borderBottomWidth),
			};
		});

		const contentTop =
			afterBox.y + fieldsetStyle.borderTopWidth + fieldsetStyle.paddingTop;
		const contentBottom =
			afterBox.y +
			afterBox.height -
			fieldsetStyle.borderBottomWidth -
			fieldsetStyle.paddingBottom;
		const contentCenter = (contentTop + contentBottom) / 2;
		const draftCenter = draftBox.y + draftBox.height / 2;

		const offset = Math.abs(draftCenter - contentCenter);
		expect(offset).toBeLessThanOrEqual(1);
	});
});

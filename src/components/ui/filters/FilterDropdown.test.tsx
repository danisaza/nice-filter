import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "@/App";

describe("FilterDropdown", () => {
	describe("TEXT filter keyboard navigation", () => {
		it("should focus text input when pressing right arrow on Text filter option", async () => {
			const user = userEvent.setup();

			render(<App />);

			// Open the filter dropdown by clicking the Filter button
			const filterButton = screen.getByRole("button", { name: /filter/i });
			await user.click(filterButton);

			// Wait for dropdown to open and find the Text submenu trigger
			const textOption = await screen.findByText("Text");
			expect(textOption).toBeInTheDocument();

			// Focus the Text option (simulating keyboard navigation to it)
			textOption.focus();

			// Press right arrow to open the submenu - this should focus the text input
			await user.keyboard("{ArrowRight}");

			// Wait for the submenu to open
			const textInput = await screen.findByPlaceholderText(
				"Enter search text...",
			);
			expect(textInput).toBeInTheDocument();

			// The text input should have focus after opening via keyboard
			expect(textInput).toHaveFocus();
		});

		it("should create a filter with the entered text when submitting", async () => {
			const user = userEvent.setup();

			render(<App />);

			// Open the filter dropdown
			const filterButton = screen.getByRole("button", { name: /filter/i });
			await user.click(filterButton);

			// Navigate to Text option and open submenu
			const textOption = await screen.findByText("Text");
			textOption.focus();
			await user.keyboard("{ArrowRight}");

			// Type a search query
			const textInput = await screen.findByPlaceholderText(
				"Enter search text...",
			);
			await user.type(textInput, "implement");

			// Submit by pressing Enter
			await user.keyboard("{Enter}");

			// The dropdown should close automatically after submitting
			// (the text input should no longer be in the document)
			await waitFor(() => {
				expect(
					screen.queryByPlaceholderText("Enter search text..."),
				).not.toBeInTheDocument();
			});

			// The filter chip should now show "text contains implement"
			// Find the applied filter fieldset by its name attribute
			const appliedFilter = document.querySelector(
				'fieldset[name="text filter"]',
			);
			expect(appliedFilter).toBeInTheDocument();

			// The filter should display the relationship operator
			expect(
				within(appliedFilter as HTMLElement).getByText("contains"),
			).toBeInTheDocument();

			// The filter should display the entered search text "implement"
			expect(
				within(appliedFilter as HTMLElement).getByText("implement"),
			).toBeInTheDocument();
		});
	});
});

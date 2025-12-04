import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";
import { ChipFilterInput } from "./ChipFilterInput";
import type { FilterConfig, TFilterChip } from "./types";

// Sample filter config for tests
const filterConfig: FilterConfig[] = [
	{ key: "status", values: ["open", "closed", "merged"] },
	{ key: "author", values: ["dan", "sarah", "mike", "emma"] },
	{ key: "label", values: ["bug", "feature", "documentation"] },
	{ key: "assignee", values: ["dan", "sarah", "mike"] },
];

// Helper component that wraps ChipFilterInput with controlled state
function ChipFilterInputWrapper({
	initialFilters = [],
}: {
	initialFilters?: TFilterChip[];
}) {
	const [filters, setFilters] = useState<TFilterChip[]>(initialFilters);
	return (
		<ChipFilterInput
			filters={filters}
			onFiltersChange={setFilters}
			filterConfig={filterConfig}
			placeholder="Filter by typing key:value..."
		/>
	);
}

describe("ChipFilterInput", () => {
	describe("dropdown visibility on focus", () => {
		test("dropdown is not visible initially", () => {
			render(<ChipFilterInputWrapper />);

			expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
		});

		test("dropdown becomes visible when input is focused", async () => {
			const user = userEvent.setup();
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
			await user.click(input);

			const listbox = screen.getByRole("listbox");
			expect(listbox).toBeInTheDocument();

			// Should show all filter keys
			const options = within(listbox).getAllByRole("option");
			expect(options).toHaveLength(filterConfig.length);
		});
	});

	describe("first option highlighted by default", () => {
		test("first option has aria-selected=true when dropdown opens", async () => {
			const user = userEvent.setup();
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
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
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
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
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
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
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
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
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
			await user.click(input);

			// Navigate to last option
			const options = within(screen.getByRole("listbox")).getAllByRole("option");
			const lastIndex = options.length - 1;

			for (let i = 0; i < lastIndex; i++) {
				await user.keyboard("{ArrowDown}");
			}

			// Verify we're at the last option
			let currentOptions = within(screen.getByRole("listbox")).getAllByRole(
				"option",
			);
			expect(currentOptions[lastIndex]).toHaveAttribute("aria-selected", "true");

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
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
			await user.click(input);

			// First option should be "status:" - press Enter
			await user.keyboard("{Enter}");

			// Input should now contain "status:"
			expect(input).toHaveValue("status:");

			// Dropdown should now show value options for status
			const listbox = screen.getByRole("listbox");
			const options = within(listbox).getAllByRole("option");

			// Should show the status values
			expect(options).toHaveLength(3); // open, closed, merged
			expect(options[0]).toHaveTextContent("open");
			expect(options[1]).toHaveTextContent("closed");
			expect(options[2]).toHaveTextContent("merged");

			// First value option should be highlighted
			expect(options[0]).toHaveAttribute("aria-selected", "true");
		});
	});

	describe("Enter on value creates chip", () => {
		test("pressing Enter on a value suggestion creates a chip and clears input", async () => {
			const user = userEvent.setup();
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
			await user.click(input);

			// Select "status:" key
			await user.keyboard("{Enter}");

			// Now select "open" value (first option)
			await user.keyboard("{Enter}");

			// Input should be cleared
			expect(input).toHaveValue("");

			// A chip should be created with "status: open"
			const chip = screen.getByRole("button", {
				name: /filter: status equals open/i,
			});
			expect(chip).toBeInTheDocument();
			expect(chip).toHaveTextContent("status:");
			expect(chip).toHaveTextContent("open");
		});

		test("can navigate to different value with arrow keys before selecting", async () => {
			const user = userEvent.setup();
			render(<ChipFilterInputWrapper />);

			const input = screen.getByRole("textbox", { name: /filter input/i });
			await user.click(input);

			// Select "status:" key
			await user.keyboard("{Enter}");

			// Navigate to "closed" (second option)
			await user.keyboard("{ArrowDown}");

			// Select it
			await user.keyboard("{Enter}");

			// A chip should be created with "status: closed"
			const chip = screen.getByRole("button", {
				name: /filter: status equals closed/i,
			});
			expect(chip).toBeInTheDocument();
		});
	});
});


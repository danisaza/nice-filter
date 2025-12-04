import { Search } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFilters } from "@/App";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { FilterChip } from "./FilterChip";
import type { ChipFilterInputProps, TAutocompleteSuggestion } from "./types";
import {
	convertTAppliedFilterToChips,
	findComboboxOptionByValue,
	findFilterOptionByKey,
	getAutocompleteSuggestions,
	type ParsedFilterEntry,
	parseFilterText,
	wouldSpaceBeValidPrefix,
} from "./utils";

export const ChipFilterInput: React.FC<ChipFilterInputProps> = ({
	placeholder = "Filter by typing key:value...",
	className = "",
	"data-id": dataId,
}) => {
	const {
		addFilter,
		filterCategories,
		filters,
		removeFilter,
		updateFilterValues,
	} = useFilters();
	const [inputValue, setInputValue] = useState("");
	const [focusedChipIndex, setFocusedChipIndex] = useState<number | null>(null);
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const [autocompletePosition, setAutocompletePosition] = useState({
		top: 0,
		left: 0,
	});
	const [isInputFocused, setIsInputFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Convert TAppliedFilter[] to TFilterChip[] for display
	const displayChips = useMemo(
		() => convertTAppliedFilterToChips(filters, filterCategories),
		[filters, filterCategories],
	);

	// Get autocomplete suggestions using filterCategories directly
	const suggestions = getAutocompleteSuggestions(inputValue, filterCategories);

	useEffect(() => {
		// Show autocomplete when input is focused and has suggestions
		setShowAutocomplete(isInputFocused && suggestions.length > 0);
		setSelectedSuggestionIndex(0);
	}, [suggestions.length, isInputFocused]);

	useEffect(() => {
		if (containerRef.current && inputRef.current) {
			const containerRect = containerRef.current.getBoundingClientRect();
			const inputRect = inputRef.current.getBoundingClientRect();
			setAutocompletePosition({
				top: inputRect.bottom - containerRect.top,
				left: inputRect.left - containerRect.left,
			});
		}
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setFocusedChipIndex(null);
	};

	const handleInputFocus = () => {
		setIsInputFocused(true);
		setFocusedChipIndex(null);
	};

	const handleInputBlur = () => {
		// Delay to allow click events on dropdown to fire
		setTimeout(() => {
			setIsInputFocused(false);
		}, 200);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Autocomplete navigation
		if (showAutocomplete && suggestions.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedSuggestionIndex((prev) =>
					prev < suggestions.length - 1 ? prev + 1 : 0,
				);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedSuggestionIndex((prev) =>
					prev > 0 ? prev - 1 : suggestions.length - 1,
				);
				return;
			}
			if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
				e.preventDefault();
				handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				setShowAutocomplete(false);
				return;
			}
		}
		// Handle space key intelligently:
		// - If dropdown is open with suggestions and input is empty, select highlighted option
		// - If the current input + space is a valid prefix for an option, allow the space
		// - Otherwise, try to create a chip (same behavior as Enter)
		if (e.key === " ") {
			// If input is empty but dropdown is showing, select the highlighted option
			if (!inputValue.trim() && showAutocomplete && suggestions.length > 0) {
				const highlightedSuggestion = suggestions[selectedSuggestionIndex];
				if (highlightedSuggestion) {
					e.preventDefault();
					handleSuggestionSelect(highlightedSuggestion);
					return;
				}
			}

			// If input has content, check if space would be a valid prefix
			if (inputValue.trim()) {
				if (!wouldSpaceBeValidPrefix(inputValue, filterCategories)) {
					// Space wouldn't make sense here, so select the highlighted suggestion
					const highlightedSuggestion = suggestions[selectedSuggestionIndex];
					if (highlightedSuggestion) {
						e.preventDefault();
						handleSuggestionSelect(highlightedSuggestion);
						return;
					}
				}
				// Otherwise, let the space be typed normally
			}
		}

		// Create chip on Enter (for manual typing)
		if (e.key === "Enter" && inputValue.trim()) {
			const { entries } = parseFilterText(inputValue);
			if (entries.length > 0) {
				e.preventDefault();
				handleCreateChipsFromText(entries);
				setInputValue("");
				setShowAutocomplete(false);
				return;
			}
		}
		// Navigate to chips with arrow keys
		if (
			e.key === "ArrowLeft" &&
			inputRef.current?.selectionStart === 0 &&
			displayChips.length > 0
		) {
			e.preventDefault();
			setFocusedChipIndex(displayChips.length - 1);
			return;
		}
		// Backspace to remove last chip
		if (e.key === "Backspace" && inputValue === "" && displayChips.length > 0) {
			e.preventDefault();
			handleRemoveChip(displayChips.length - 1);
			return;
		}
	};

	const handleChipKeyDown = (e: React.KeyboardEvent, index: number) => {
		if (e.key === "Delete" || e.key === "Backspace") {
			e.preventDefault();
			handleRemoveChip(index);
			if (index < displayChips.length - 1) {
				setFocusedChipIndex(index);
			} else {
				setFocusedChipIndex(null);
				inputRef.current?.focus();
			}
			return;
		}
		if (e.key === "ArrowLeft" && index > 0) {
			e.preventDefault();
			setFocusedChipIndex(index - 1);
			return;
		}
		if (e.key === "ArrowRight") {
			e.preventDefault();
			if (index < displayChips.length - 1) {
				setFocusedChipIndex(index + 1);
			} else {
				setFocusedChipIndex(null);
				inputRef.current?.focus();
			}
			return;
		}
	};

	/**
	 * Creates filters from manually typed text entries.
	 * Uses string matching to find the corresponding filter options.
	 */
	const handleCreateChipsFromText = (entries: ParsedFilterEntry[]) => {
		for (const entry of entries) {
			const filterOption = findFilterOptionByKey(filterCategories, entry.key);
			if (!filterOption) {
				continue;
			}

			const comboboxOption = findComboboxOptionByValue(
				filterOption.options,
				entry.value,
			);
			if (!comboboxOption) {
				continue;
			}

			addOrUpdateFilter(filterOption.id, comboboxOption);
		}
	};

	/**
	 * Adds a value to an existing filter or creates a new filter.
	 * Used by both autocomplete selection and manual text entry.
	 */
	const addOrUpdateFilter = (
		categoryId: string,
		comboboxOption: { id: string; label: string; value: string },
	) => {
		const filterOption = filterCategories.find((c) => c.id === categoryId);
		if (!filterOption) {
			return;
		}

		// Check if a filter already exists for this category
		const existingFilter = filters.find((f) => f.categoryId === categoryId);

		if (existingFilter) {
			// Add value to existing filter if not already present
			const valueExists = existingFilter.values.some(
				(v) => v.id === comboboxOption.id,
			);
			if (!valueExists) {
				updateFilterValues(existingFilter.id, (prevValues) => [
					...prevValues,
					comboboxOption,
				]);
			}
		} else {
			// Create new filter
			const newFilter = {
				id: uuidv4(),
				categoryId: filterOption.id,
				selectionType: filterOption.selectionType,
				propertyNameSingular: filterOption.propertyNameSingular,
				propertyNamePlural: filterOption.propertyNamePlural,
				options: filterOption.options,
				values: [comboboxOption],
			};
			addFilter(newFilter);
		}
	};

	/**
	 * Removes a chip using its IDs for direct lookup.
	 * No string matching needed - uses categoryId and valueId.
	 */
	const handleRemoveChip = (index: number) => {
		const chip = displayChips[index];
		if (!chip) {
			return;
		}

		// Use IDs directly for lookup - no string matching needed
		const existingFilter = filters.find(
			(f) => f.categoryId === chip.categoryId,
		);
		if (!existingFilter) {
			return;
		}

		// If this is the last value, remove the entire filter
		if (existingFilter.values.length === 1) {
			removeFilter(existingFilter.id);
		} else {
			// Otherwise, remove just this value by ID
			updateFilterValues(existingFilter.id, (prevValues) =>
				prevValues.filter((v) => v.id !== chip.valueId),
			);
		}

		setFocusedChipIndex(null);
		inputRef.current?.focus();
	};

	const handleEditChip = (index: number) => {
		const chip = displayChips[index];
		if (!chip) {
			return;
		}

		setInputValue(chip.raw);
		handleRemoveChip(index);
	};

	/**
	 * Handles autocomplete suggestion selection.
	 * For value suggestions, uses IDs directly instead of parsing.
	 */
	const handleSuggestionSelect = (suggestion: TAutocompleteSuggestion) => {
		if (suggestion.type === "key") {
			// Key selected - update input to show key: and keep dropdown open for values
			setInputValue(suggestion.text);
			// Don't hide autocomplete - let useEffect show value suggestions
		} else {
			// Value selected - use IDs directly if available
			if (suggestion.categoryId && suggestion.optionId) {
				// Find the full combobox option by ID
				const category = filterCategories.find(
					(c) => c.id === suggestion.categoryId,
				);
				const option = category?.options.find(
					(o) => o.id === suggestion.optionId,
				);

				if (option) {
					addOrUpdateFilter(suggestion.categoryId, option);
					setInputValue("");
				}
			} else {
				// Fallback to text parsing if IDs aren't available
				const keyMatch = inputValue.match(/(\w+):(.*)$/);
				if (keyMatch) {
					const [, key] = keyMatch;
					// Use quotes for values with spaces
					const valueText = suggestion.text.includes(" ")
						? `"${suggestion.text}"`
						: suggestion.text;
					const completedFilter = `${key}:${valueText}`;
					const { entries } = parseFilterText(completedFilter);
					if (entries.length > 0) {
						handleCreateChipsFromText(entries);
						setInputValue("");
					}
				}
			}
			setShowAutocomplete(false);
		}
		inputRef.current?.focus();
	};

	const handleContainerClick = (e: React.MouseEvent) => {
		// Only focus input if clicking on the container itself, not on chips
		if (e.target === e.currentTarget) {
			inputRef.current?.focus();
			setFocusedChipIndex(null);
		}
	};

	return (
		<div
			ref={containerRef}
			className={`relative ${className}`}
			data-id={dataId}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: label focuses input on click, keyboard is handled by input element itself */}
			<label
				onClick={handleContainerClick}
				className="flex items-center flex-wrap gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-all cursor-text min-h-[42px]"
			>
				<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

				{displayChips.map((chip, index) => (
					<FilterChip
						key={chip.id}
						chip={chip}
						onRemove={() => handleRemoveChip(index)}
						onEdit={() => handleEditChip(index)}
						isEditing={false}
						isFocused={focusedChipIndex === index}
						onFocus={() => setFocusedChipIndex(index)}
						onKeyDown={(e) => handleChipKeyDown(e, index)}
					/>
				))}

				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleInputKeyDown}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					placeholder={displayChips.length === 0 ? placeholder : ""}
					className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 placeholder-gray-400"
					role="combobox"
					aria-label="Filter input"
					aria-autocomplete="list"
					aria-controls="autocomplete-dropdown"
					aria-expanded={showAutocomplete}
				/>
			</label>

			<AutocompleteDropdown
				suggestions={suggestions}
				selectedIndex={selectedSuggestionIndex}
				onSelect={handleSuggestionSelect}
				position={autocompletePosition}
				visible={showAutocomplete}
			/>
		</div>
	);
};

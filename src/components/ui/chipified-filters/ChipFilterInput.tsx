import { Search } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFilters } from "@/App";
import AppliedFilter from "@/components/ui/filters/AppliedFilter";
import { SELECTION_TYPES } from "@/hooks/useFilters/constants";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import type { ChipFilterInputProps, TAutocompleteSuggestion } from "./types";
import {
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
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
	const [autocompletePosition, setAutocompletePosition] = useState({
		top: 0,
		left: 0,
	});
	const [isInputFocused, setIsInputFocused] = useState(false);
	// Track pending selections for multi-select filters (before Enter is pressed)
	const [pendingSelections, setPendingSelections] = useState<Set<string>>(
		new Set(),
	);
	// Track the current category being filtered for multi-select context
	const [currentMultiSelectCategoryId, setCurrentMultiSelectCategoryId] =
		useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

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

	// Clear pending selections when input changes to a different category or clears
	useEffect(() => {
		if (!inputValue.includes(":")) {
			// No category selected, clear multi-select state
			if (pendingSelections.size > 0) {
				setPendingSelections(new Set());
			}
			if (currentMultiSelectCategoryId !== null) {
				setCurrentMultiSelectCategoryId(null);
			}
		}
	}, [inputValue, pendingSelections.size, currentMultiSelectCategoryId]);

	/**
	 * Adds a value to an existing filter or creates a new filter.
	 * Used by both autocomplete selection and manual text entry.
	 */
	const addOrUpdateFilter = useCallback(
		(
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
		},
		[filterCategories, filters, updateFilterValues, addFilter],
	);

	/**
	 * Commits all pending selections for a multi-select filter.
	 * Creates a SINGLE new filter with all selected values.
	 * Does NOT merge with existing filters - each multi-select session creates a distinct filter.
	 */
	const commitPendingSelections = useCallback(() => {
		if (pendingSelections.size === 0 || !currentMultiSelectCategoryId) {
			return;
		}

		const category = filterCategories.find(
			(c) => c.id === currentMultiSelectCategoryId,
		);
		if (!category) {
			return;
		}

		// Collect all selected options into a single array
		const selectedOptions: { id: string; label: string; value: string }[] = [];
		for (const optionId of pendingSelections) {
			const option = category.options.find((o) => o.id === optionId);
			if (option) {
				selectedOptions.push(option);
			}
		}

		if (selectedOptions.length === 0) {
			return;
		}

		// Create a SINGLE new filter with ALL selected values
		// This is intentionally independent of any existing filters for the same category
		const newFilter = {
			id: uuidv4(),
			categoryId: category.id,
			selectionType: category.selectionType,
			propertyNameSingular: category.propertyNameSingular,
			propertyNamePlural: category.propertyNamePlural,
			options: category.options,
			values: selectedOptions,
		};
		addFilter(newFilter);

		// Clear state
		setPendingSelections(new Set());
		setCurrentMultiSelectCategoryId(null);
		setInputValue("");
		setShowAutocomplete(false);
	}, [
		pendingSelections,
		currentMultiSelectCategoryId,
		filterCategories,
		addFilter,
	]);

	/**
	 * Toggles selection of an option for multi-select filters.
	 */
	const handleToggleSelection = useCallback(
		(suggestion: TAutocompleteSuggestion) => {
			const { optionId, categoryId } = suggestion;
			if (!optionId || !categoryId) {
				return;
			}

			setPendingSelections((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(optionId)) {
					newSet.delete(optionId);
				} else {
					newSet.add(optionId);
				}
				return newSet;
			});

			// Track which category we're selecting from
			if (currentMultiSelectCategoryId !== categoryId) {
				setCurrentMultiSelectCategoryId(categoryId);
			}
		},
		[currentMultiSelectCategoryId],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleInputFocus = () => {
		setIsInputFocused(true);
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
				// If we have pending selections (multi-select mode), commit them
				if (pendingSelections.size > 0) {
					commitPendingSelections();
					return;
				}
				handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				// Clear pending selections on escape
				setPendingSelections(new Set());
				setCurrentMultiSelectCategoryId(null);
				setShowAutocomplete(false);
				return;
			}
		}
		// Handle space key intelligently:
		// - For multi-select values, toggle selection and keep dropdown open
		// - If dropdown is open with suggestions and input is empty, select highlighted option
		// - If the current input + space is a valid prefix for an option, allow the space
		// - Otherwise, try to create a chip (same behavior as Enter)
		if (e.key === " ") {
			const highlightedSuggestion = suggestions[selectedSuggestionIndex];

			// Check if this is a multi-select value suggestion
			if (
				highlightedSuggestion?.type === "value" &&
				highlightedSuggestion.selectionType === SELECTION_TYPES.CHECKBOXES
			) {
				e.preventDefault();
				handleToggleSelection(highlightedSuggestion);
				return;
			}

			// If input is empty but dropdown is showing, select the highlighted option
			if (!inputValue.trim() && showAutocomplete && suggestions.length > 0) {
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
			// If we have pending selections (multi-select mode), commit them
			if (pendingSelections.size > 0) {
				e.preventDefault();
				commitPendingSelections();
				return;
			}
			const { entries } = parseFilterText(inputValue);
			if (entries.length > 0) {
				e.preventDefault();
				handleCreateChipsFromText(entries);
				setInputValue("");
				setShowAutocomplete(false);
				return;
			}
		}
		// Backspace to remove last filter
		if (e.key === "Backspace" && inputValue === "" && filters.length > 0) {
			e.preventDefault();
			// Remove the most recently created filter
			const lastFilter = filters.reduce((latest, filter) =>
				filter.createdAt > latest.createdAt ? filter : latest,
			);
			removeFilter(lastFilter.id);
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
			// Don't hide autocomplete - let the useEffect manage visibility
			// based on isInputFocused and suggestions.length
		}
		inputRef.current?.focus();
	};

	const handleContainerClick = (e: React.MouseEvent) => {
		// Only focus input if clicking on the container itself, not on chips
		if (e.target === e.currentTarget) {
			inputRef.current?.focus();
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

				{filters.map((filter) => (
					<AppliedFilter key={filter.id} filter={filter} />
				))}

				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleInputKeyDown}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					placeholder={filters.length === 0 ? placeholder : ""}
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
				onToggleSelection={handleToggleSelection}
				pendingSelections={pendingSelections}
				position={autocompletePosition}
				visible={showAutocomplete}
			/>
		</div>
	);
};

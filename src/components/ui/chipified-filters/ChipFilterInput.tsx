import { Search } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { AutocompleteDropdown } from "./AutocompleteDropdown";
import { FilterChip } from "./FilterChip";
import type { ChipFilterInputProps, TAutocompleteSuggestion } from "./types";
import { getAutocompleteSuggestions, parseFilterText } from "./utils";
export const ChipFilterInput: React.FC<ChipFilterInputProps> = ({
	filters,
	onFiltersChange,
	filterConfig,
	placeholder = "Filter by typing key:value...",
	freeTextAllowed = true,
	className = "",
	"data-id": dataId,
}) => {
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
	const suggestions = getAutocompleteSuggestions(
		inputValue,
		filterConfig,
		filters,
	);
	useEffect(() => {
		// Show autocomplete when input is focused and has suggestions
		setShowAutocomplete(isInputFocused && suggestions.length > 0);
		setSelectedSuggestionIndex(0);
	}, [inputValue, suggestions.length, isInputFocused]);
	useEffect(() => {
		if (containerRef.current && inputRef.current) {
			const containerRect = containerRef.current.getBoundingClientRect();
			const inputRect = inputRef.current.getBoundingClientRect();
			setAutocompletePosition({
				top: inputRect.bottom - containerRect.top,
				left: inputRect.left - containerRect.left,
			});
		}
	}, [inputValue]);
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
	const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
		// Create chip on space or enter
		if ((e.key === " " || e.key === "Enter") && inputValue.trim()) {
			const { chips: newChips } = parseFilterText(inputValue);
			if (newChips.length > 0) {
				e.preventDefault();
				onFiltersChange([...filters, ...newChips]);
				setInputValue("");
				setShowAutocomplete(false);
				return;
			}
		}
		// Navigate to chips with arrow keys
		if (
			e.key === "ArrowLeft" &&
			inputRef.current?.selectionStart === 0 &&
			filters.length > 0
		) {
			e.preventDefault();
			setFocusedChipIndex(filters.length - 1);
			return;
		}
		// Backspace to remove last chip
		if (e.key === "Backspace" && inputValue === "" && filters.length > 0) {
			e.preventDefault();
			onFiltersChange(filters.slice(0, -1));
			return;
		}
	};
	const handleChipKeyDown = (e: KeyboardEvent, index: number) => {
		if (e.key === "Delete" || e.key === "Backspace") {
			e.preventDefault();
			handleRemoveChip(index);
			if (index < filters.length - 1) {
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
			if (index < filters.length - 1) {
				setFocusedChipIndex(index + 1);
			} else {
				setFocusedChipIndex(null);
				inputRef.current?.focus();
			}
			return;
		}
	};
	const handleRemoveChip = (index: number) => {
		const newFilters = filters.filter((_, i) => i !== index);
		onFiltersChange(newFilters);
		setFocusedChipIndex(null);
		inputRef.current?.focus();
	};
	const handleEditChip = (index: number) => {
		const chip = filters[index];
		setInputValue(chip.raw);
		handleRemoveChip(index);
	};
	const handleSuggestionSelect = (suggestion: TAutocompleteSuggestion) => {
		if (suggestion.type === "key") {
			setInputValue(suggestion.text);
		} else {
			// Value selected - complete the filter and create chip immediately
			const keyMatch = inputValue.match(/(\w+):(\w*)$/);
			if (keyMatch) {
				const [, key] = keyMatch;
				const completedFilter = `${key}:${suggestion.text}`;
				// Parse and create chip
				const { chips: newChips } = parseFilterText(completedFilter);
				if (newChips.length > 0) {
					onFiltersChange([...filters, ...newChips]);
					setInputValue("");
				}
			}
		}
		setShowAutocomplete(false);
		inputRef.current?.focus();
	};
	const handleContainerClick = () => {
		inputRef.current?.focus();
		setFocusedChipIndex(null);
	};
	return (
		<div
			ref={containerRef}
			className={`relative ${className}`}
			data-id={dataId}
		>
			<div
				onClick={handleContainerClick}
				className="flex items-center flex-wrap gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-all cursor-text min-h-[42px]"
			>
				<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />

				{filters.map((chip, index) => (
					<div
						key={chip.id}
						onKeyDown={(e) => handleChipKeyDown(e as any, index)}
					>
						<FilterChip
							chip={chip}
							onRemove={() => handleRemoveChip(index)}
							onEdit={() => handleEditChip(index)}
							isEditing={false}
							isFocused={focusedChipIndex === index}
							onFocus={() => setFocusedChipIndex(index)}
						/>
					</div>
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
					aria-label="Filter input"
					aria-autocomplete="list"
					aria-controls="autocomplete-dropdown"
					aria-expanded={showAutocomplete}
				/>
			</div>

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

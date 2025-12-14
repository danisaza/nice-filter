import { Check } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import type { AutocompleteDropdownProps } from "./types";
export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
	suggestions,
	selectedIndex,
	onSelect,
	onToggleSelection,
	pendingSelections,
	position,
	visible,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (visible && dropdownRef.current) {
			const selectedElement = dropdownRef.current.querySelector(
				`[data-index="${selectedIndex}"]`,
			);
			if (selectedElement) {
				selectedElement.scrollIntoView({
					block: "nearest",
				});
			}
		}
	}, [selectedIndex, visible]);
	if (!visible || suggestions.length === 0) {
		return null;
	}

	const handleCheckboxClick = (
		e: React.MouseEvent,
		suggestion: AutocompleteDropdownProps["suggestions"][0],
	) => {
		// Stop propagation so the button's onClick doesn't fire
		e.stopPropagation();
		// Toggle selection without closing dropdown
		onToggleSelection?.(suggestion);
	};

	return (
		<div
			ref={dropdownRef}
			id="autocomplete-dropdown"
			className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
			style={{
				top: position.top,
				left: position.left,
			}}
			role="listbox"
		>
			{suggestions.map((suggestion, index) => {
				// Multi-select is available for all value suggestions (both radio and checkbox column types)
				const isMultiSelect = suggestion.type === "value";
				const isChecked =
					isMultiSelect &&
					suggestion.optionId &&
					pendingSelections?.has(suggestion.optionId);

				return (
					<button
						key={`${suggestion.type}-${suggestion.text}-${index}`}
						type="button"
						tabIndex={-1}
						data-index={index}
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => onSelect(suggestion)}
						className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${index === selectedIndex ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:bg-gray-50"}`}
						role="option"
						aria-selected={index === selectedIndex}
					>
						{isMultiSelect && (
							// biome-ignore lint/a11y/useKeyWithClickEvents: keyboard interaction handled by parent button via Space key
							// biome-ignore lint/a11y/useSemanticElements: custom styled checkbox with click handler
							<span
								role="checkbox"
								aria-checked={!!isChecked}
								tabIndex={-1}
								onClick={(e) => handleCheckboxClick(e, suggestion)}
								className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center cursor-pointer ${
									isChecked
										? "bg-blue-500 border-blue-500 text-white"
										: "border-gray-300 hover:border-gray-400"
								}`}
							>
								{isChecked ? <Check className="w-3 h-3" /> : null}
							</span>
						)}
						{suggestion.icon && (
							<span className="flex-shrink-0 text-gray-400">
								{suggestion.icon}
							</span>
						)}
						<span className="flex-1">
							{suggestion.type === "key" ? (
								<span className="font-medium">{suggestion.text}</span>
							) : (
								<>
									<span className="text-gray-500">{suggestion.filterKey}:</span>
									<span className="font-medium ml-1">{suggestion.text}</span>
								</>
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
};

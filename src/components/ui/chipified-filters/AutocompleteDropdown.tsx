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

	const handleClick = (
		suggestion: AutocompleteDropdownProps["suggestions"][0],
	) => {
		// For multi-select values, toggle selection instead of committing
		if (
			suggestion.type === "value" &&
			suggestion.selectionType === "checkboxes" &&
			onToggleSelection
		) {
			onToggleSelection(suggestion);
		} else {
			onSelect(suggestion);
		}
	};

	return (
		<div
			ref={dropdownRef}
			className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
			style={{
				top: position.top,
				left: position.left,
			}}
			role="listbox"
		>
			{suggestions.map((suggestion, index) => {
				const isMultiSelect =
					suggestion.type === "value" &&
					suggestion.selectionType === "checkboxes";
				const isChecked =
					isMultiSelect &&
					suggestion.optionId &&
					pendingSelections?.has(suggestion.optionId);

				return (
					<button
						key={`${suggestion.type}-${suggestion.text}-${index}`}
						type="button"
						data-index={index}
						onClick={() => handleClick(suggestion)}
						className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${index === selectedIndex ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:bg-gray-50"}`}
						role="option"
						aria-selected={index === selectedIndex}
					>
						{isMultiSelect && (
							<span
								className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center ${
									isChecked
										? "bg-blue-500 border-blue-500 text-white"
										: "border-gray-300"
								}`}
							>
								{isChecked && <Check className="w-3 h-3" />}
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

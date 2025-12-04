import { X } from "lucide-react";
import type React from "react";
import type { FilterChipProps } from "./types";

export const FilterChip: React.FC<FilterChipProps> = ({
	chip,
	onRemove,
	onEdit,
	isFocused,
	onFocus,
	onKeyDown,
}) => {
	const handleRemoveClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onRemove();
	};

	const handleRemoveKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.stopPropagation();
			onRemove();
		}
	};

	return (
		<button
			type="button"
			onClick={onEdit}
			onFocus={onFocus}
			onKeyDown={onKeyDown}
			className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all duration-150 ${isFocused ? "bg-blue-100 ring-2 ring-blue-500 ring-offset-1" : "bg-gray-100 hover:bg-gray-200"}`}
			aria-label={`Filter: ${chip.key} equals ${chip.value}. Click to edit, or press Delete to remove.`}
			tabIndex={isFocused ? 0 : -1}
		>
			<span className="text-gray-600 font-medium">{chip.key}:</span>
			<span className="text-gray-900 font-medium">{chip.value}</span>
			<span
				role="button"
				tabIndex={-1}
				onClick={handleRemoveClick}
				onKeyDown={handleRemoveKeyDown}
				className="ml-1 p-0.5 rounded hover:bg-red-100 transition-colors cursor-pointer"
				aria-label={`Remove ${chip.key}:${chip.value} filter`}
			>
				<X className="w-3 h-3 text-gray-500 hover:text-red-600" />
			</span>
		</button>
	);
};

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toolbar from "@radix-ui/react-toolbar";
import { X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { DraftTextFilterState } from "./ChipFilterInput";

const TEXT_OPERATORS = ["contains", "does not contain"] as const;

interface DraftTextFilterProps {
	draft: DraftTextFilterState;
	onCommit: () => void;
	onCancel: () => void;
	onTextChange: (value: string) => void;
	onOperatorChange: (operator: "contains" | "does not contain") => void;
}

const dropdownMenuContentClassNames =
	"border border-slate-300 min-w-[220px] bg-white rounded-md p-1 shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2";

/**
 * A draft text filter chip with an inline editable input.
 * The filter is not committed to the context until the user presses Enter or blurs the input.
 */
export const DraftTextFilter: React.FC<DraftTextFilterProps> = ({
	draft,
	onCommit,
	onCancel,
	onTextChange,
	onOperatorChange,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const operatorButtonRef = useRef<HTMLButtonElement>(null);
	// Track whether Enter was pressed to prevent double-commit.
	// When Enter is pressed, onCommit() focuses the main input, which triggers blur.
	// Without this guard, the blur handler would call onCommit() a second time
	// before React state updates, causing the filter to be added twice.
	const committedViaEnterRef = useRef(false);
	const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);

	// Auto-focus the input when the component mounts
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			committedViaEnterRef.current = true;
			onCommit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancel();
		} else if (e.key === "ArrowLeft") {
			// Move focus to operator button when cursor is at position 0
			const input = inputRef.current;
			if (input && input.selectionStart === 0 && input.selectionEnd === 0) {
				e.preventDefault();
				operatorButtonRef.current?.focus();
			}
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		// Skip if we already committed via Enter key press
		if (committedViaEnterRef.current) {
			return;
		}
		// Skip blur if focus is moving to the operator button or dropdown
		// This prevents committing when user clicks on the operator
		const relatedTarget = e.relatedTarget;
		if (
			relatedTarget &&
			(relatedTarget === operatorButtonRef.current ||
				relatedTarget.closest('[role="menu"]'))
		) {
			return;
		}
		// Commit the filter when the input loses focus
		onCommit();
	};

	const handleOperatorSelect = (operator: "contains" | "does not contain") => {
		onOperatorChange(operator);
		setIsOperatorDropdownOpen(false);
		// Return focus to the text input after selecting an operator
		inputRef.current?.focus();
	};

	const handleOperatorKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		if (e.key === "ArrowRight") {
			e.preventDefault();
			inputRef.current?.focus();
		} else if (e.key === "Escape" && !isOperatorDropdownOpen) {
			e.preventDefault();
			onCancel();
		}
	};

	const handleOperatorBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
		// Skip blur if focus is moving to the input or dropdown
		const relatedTarget = e.relatedTarget;
		if (
			relatedTarget &&
			(relatedTarget === inputRef.current ||
				relatedTarget.closest('[role="menu"]'))
		) {
			return;
		}
		// Skip if dropdown is open (focus is going to dropdown content)
		if (isOperatorDropdownOpen) {
			return;
		}
		// Commit the filter when focus leaves the chip entirely
		if (!committedViaEnterRef.current) {
			onCommit();
		}
	};

	return (
		<fieldset
			name={`${draft.propertyNameSingular} filter`}
			className="border border-blue-400 text-slate-900 rounded inline-flex items-center h-9 bg-blue-50"
		>
			{/* Property name */}
			<span className="px-2 rounded-tl rounded-bl border-r border-blue-300 h-full flex items-center text-sm">
				{draft.propertyNameSingular}
			</span>

			{/* Operator dropdown */}
			<DropdownMenu.Root
				open={isOperatorDropdownOpen}
				onOpenChange={setIsOperatorDropdownOpen}
			>
				<Toolbar.Button asChild>
					<DropdownMenu.Trigger asChild>
						<button
							ref={operatorButtonRef}
							type="button"
							className="h-full px-2 whitespace-nowrap border-r border-blue-300 hover:bg-blue-100 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 text-sm"
							aria-label="Filter relationship"
							onKeyDown={handleOperatorKeyDown}
							onBlur={handleOperatorBlur}
						>
							{draft.operator}
						</button>
					</DropdownMenu.Trigger>
				</Toolbar.Button>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className={dropdownMenuContentClassNames}
						sideOffset={5}
						onCloseAutoFocus={(e) => {
							// Prevent default to manually control focus
							e.preventDefault();
							inputRef.current?.focus();
						}}
					>
						<DropdownMenu.RadioGroup
							value={draft.operator}
							onValueChange={(value) =>
								handleOperatorSelect(value as "contains" | "does not contain")
							}
						>
							{TEXT_OPERATORS.map((operator) => (
								<DropdownMenu.RadioItem
									className="text-nowrap relative flex items-center px-2 py-1.5 outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
									key={operator}
									value={operator}
								>
									{operator}
								</DropdownMenu.RadioItem>
							))}
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Arrow className="fill-white" />
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{/* Text input */}
			<input
				ref={inputRef}
				type="text"
				value={draft.textValue}
				onChange={(e) => onTextChange(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				placeholder="type to search..."
				className="px-2 h-full min-w-[100px] max-w-[200px] outline-none text-sm bg-transparent"
				aria-label={`${draft.propertyNameSingular} filter value`}
			/>

			{/* Remove button */}
			<Toolbar.Button asChild>
				<button
					type="button"
					className="h-full px-2 rounded-tr rounded-br text-slate-600 hover:text-slate-900 hover:bg-blue-100 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
					onClick={(e) => {
						e.preventDefault();
						onCancel();
					}}
					onMouseDown={(e) => {
						// Prevent blur from firing before click
						e.preventDefault();
					}}
					aria-label="Cancel filter"
				>
					<X className="w-4 h-4" aria-hidden="true" />
				</button>
			</Toolbar.Button>
		</fieldset>
	);
};

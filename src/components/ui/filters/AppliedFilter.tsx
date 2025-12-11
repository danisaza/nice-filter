import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Toolbar from "@radix-ui/react-toolbar";
import { X } from "lucide-react";
import type React from "react";
import {
	createContext,
	forwardRef,
	memo,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { useFilters } from "@/App.tsx";
import FilterDropdownSubCategory from "@/components/ui/filters/FilterDropdownSubCategory";
import {
	CHECKBOX_SELECTION_OPERATORS,
	RADIO_SELECTION_OPERATORS,
	SELECTION_TYPES,
	TEXT_SELECTION_OPERATORS,
} from "@/hooks/useFilters/constants";
import type {
	Operator as OperatorType,
	TAppliedFilter,
} from "@/hooks/useFilters/types";

// ============================================================================
// Constants
// ============================================================================

const dropdownMenuContentClassNames =
	"border border-gray-200 min-w-[220px] bg-white rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2";

export type ChipHeight = "sm" | "md" | "lg";

export const CHIP_HEIGHT_VARIANTS = {
	sm: "h-7",
	md: "h-9",
	lg: "h-11",
} as const satisfies Record<ChipHeight, string>;

export const CHIP_TEXT_SIZE_VARIANTS = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
} as const satisfies Record<ChipHeight, string>;

// ============================================================================
// Context
// ============================================================================

interface AppliedFilterContextValue {
	filter: TAppliedFilter;
	chipHeight: ChipHeight;
	propertyNameToDisplay: string;
	/** If true, left arrow on the operator button won't navigate (prevents wrap) */
	preventOperatorLeftWrap?: boolean;
	/** Callback to register the remove button ref for focus management */
	removeButtonRef?: (el: HTMLButtonElement | null) => void;
	/** Custom remove handler that handles focus management */
	onRemove?: () => void;
	/** Callback when right arrow is pressed on the remove button (for custom navigation) */
	onRemoveButtonRightArrow?: () => void;
}

const AppliedFilterContext = createContext<AppliedFilterContextValue | null>(
	null,
);

function useAppliedFilterContext() {
	const context = useContext(AppliedFilterContext);
	if (!context) {
		throw new Error(
			"AppliedFilter compound components must be used within <AppliedFilter.Root>. " +
				"Make sure you're not using <AppliedFilter.Label>, <AppliedFilter.Operator>, etc. outside of their parent.",
		);
	}
	return context;
}

// ============================================================================
// Root Component
// ============================================================================

interface RootProps {
	filter: TAppliedFilter;
	/** Height variant for the chip. Defaults to "md" (36px). */
	chipHeight?: ChipHeight;
	/** If true, left arrow on the operator button won't navigate (prevents wrap) */
	preventOperatorLeftWrap?: boolean;
	/** Callback to register the remove button ref for focus management */
	removeButtonRef?: (el: HTMLButtonElement | null) => void;
	/** Custom remove handler that handles focus management */
	onRemove?: () => void;
	/** Callback when right arrow is pressed on the remove button (for custom navigation) */
	onRemoveButtonRightArrow?: () => void;
	children: React.ReactNode;
	className?: string;
}

const Root = forwardRef<HTMLFieldSetElement, RootProps>(
	(
		{
			filter,
			chipHeight = "md",
			preventOperatorLeftWrap,
			removeButtonRef,
			onRemove,
			onRemoveButtonRightArrow,
			children,
			className,
			...props
		},
		ref,
	) => {
		const { getPropertyNameToDisplay } = useFilters();
		const propertyNameToDisplay = getPropertyNameToDisplay(filter.id);
		const heightClass = CHIP_HEIGHT_VARIANTS[chipHeight];

		const contextValue = useMemo(
			() => ({
				filter,
				chipHeight,
				propertyNameToDisplay,
				preventOperatorLeftWrap,
				removeButtonRef,
				onRemove,
				onRemoveButtonRightArrow,
			}),
			[
				filter,
				chipHeight,
				propertyNameToDisplay,
				preventOperatorLeftWrap,
				removeButtonRef,
				onRemove,
				onRemoveButtonRightArrow,
			],
		);

		return (
			<AppliedFilterContext.Provider value={contextValue}>
				<Toolbar.Root asChild>
					<fieldset
						ref={ref}
						name={`${propertyNameToDisplay} filter`}
						data-testid="applied-filter"
						className={twMerge(
							"border border-slate-300 text-slate-900 rounded inline-flex items-center",
							heightClass,
							className,
						)}
						{...props}
					>
						{children}
					</fieldset>
				</Toolbar.Root>
			</AppliedFilterContext.Provider>
		);
	},
);
Root.displayName = "AppliedFilter.Root";

// ============================================================================
// Label Component
// ============================================================================

interface LabelProps {
	children?: React.ReactNode;
	className?: string;
}

const Label = forwardRef<HTMLSpanElement, LabelProps>(
	({ children, className, ...props }, ref) => {
		const { propertyNameToDisplay, chipHeight } = useAppliedFilterContext();

		return (
			<span
				ref={ref}
				className={twMerge(
					"px-2 rounded-tl rounded-bl border-r border-slate-200 h-full flex items-center",
					CHIP_TEXT_SIZE_VARIANTS[chipHeight],
					className,
				)}
				{...props}
			>
				{children ?? propertyNameToDisplay}
			</span>
		);
	},
);
Label.displayName = "AppliedFilter.Label";

// ============================================================================
// Operator Component (for radio/checkbox filters)
// ============================================================================

interface OperatorProps {
	className?: string;
}

const Operator = forwardRef<HTMLButtonElement, OperatorProps>(
	({ className, ...props }, ref) => {
		const { filter, chipHeight, preventOperatorLeftWrap } =
			useAppliedFilterContext();
		const { updateFilterRelationship } = useFilters();

		const { selectionType, values } = filter;

		// Text filters should use TextOperator instead
		if (selectionType === SELECTION_TYPES.TEXT) {
			return <TextOperator className={className} {...props} ref={ref} />;
		}

		// Get the relationship options based on the number of values
		let relationshipOptions: readonly OperatorType[];
		const relationshipOptionsByNumValues =
			selectionType === SELECTION_TYPES.RADIO
				? RADIO_SELECTION_OPERATORS
				: CHECKBOX_SELECTION_OPERATORS;
		if (values.length === 1) {
			relationshipOptions = relationshipOptionsByNumValues.ONE;
		} else {
			relationshipOptions = relationshipOptionsByNumValues.MANY;
		}

		const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "ArrowLeft" && preventOperatorLeftWrap) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		return (
			<DropdownMenu.Root>
				<Toolbar.Button asChild>
					<DropdownMenu.Trigger asChild>
						<button
							ref={ref}
							type="button"
							className={twMerge(
								"h-full px-2 whitespace-nowrap border-r border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1",
								CHIP_TEXT_SIZE_VARIANTS[chipHeight],
								className,
							)}
							aria-label="Filter relationship"
							onKeyDown={handleKeyDown}
							{...props}
						>
							{filter.relationship}
						</button>
					</DropdownMenu.Trigger>
				</Toolbar.Button>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className={dropdownMenuContentClassNames}
						sideOffset={5}
					>
						<DropdownMenu.RadioGroup
							value={filter.relationship}
							onValueChange={(option) => {
								// validate that this is a valid relationship option
								if (!relationshipOptions.includes(option as OperatorType)) {
									console.error(`Invalid relationship option: ${option}`);
									return;
								}
								updateFilterRelationship(filter.id, option as OperatorType);
							}}
						>
							{relationshipOptions.map((relationshipOption) => (
								<DropdownMenu.RadioItem
									className="text-nowrap relative flex items-center px-3 py-2 text-sm outline-none transition-colors text-gray-700 hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
									key={relationshipOption}
									value={relationshipOption}
								>
									{relationshipOption}
								</DropdownMenu.RadioItem>
							))}
						</DropdownMenu.RadioGroup>

						<DropdownMenu.Arrow className="fill-white" />
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		);
	},
);
Operator.displayName = "AppliedFilter.Operator";

// ============================================================================
// TextOperator Component (for text filters)
// ============================================================================

interface TextOperatorProps {
	className?: string;
}

const TextOperator = forwardRef<HTMLButtonElement, TextOperatorProps>(
	({ className, ...props }, ref) => {
		const { filter, chipHeight, preventOperatorLeftWrap } =
			useAppliedFilterContext();
		const { updateFilterRelationship } = useFilters();

		// Text filters always have the same set of operators
		const relationshipOptions = TEXT_SELECTION_OPERATORS.ONE;

		const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "ArrowLeft" && preventOperatorLeftWrap) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		return (
			<DropdownMenu.Root>
				<Toolbar.Button asChild>
					<DropdownMenu.Trigger asChild>
						<button
							ref={ref}
							type="button"
							className={twMerge(
								"h-full px-2 whitespace-nowrap border-r border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1",
								CHIP_TEXT_SIZE_VARIANTS[chipHeight],
								className,
							)}
							aria-label="Filter relationship"
							onKeyDown={handleKeyDown}
							{...props}
						>
							{filter.relationship}
						</button>
					</DropdownMenu.Trigger>
				</Toolbar.Button>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className={dropdownMenuContentClassNames}
						sideOffset={5}
					>
						<DropdownMenu.RadioGroup
							value={filter.relationship}
							onValueChange={(option) => {
								if (
									!(relationshipOptions as readonly string[]).includes(option)
								) {
									console.error(`Invalid relationship option: ${option}`);
									return;
								}
								updateFilterRelationship(filter.id, option as OperatorType);
							}}
						>
							{relationshipOptions.map((relationshipOption) => (
								<DropdownMenu.RadioItem
									className="text-nowrap relative flex items-center px-3 py-2 text-sm outline-none transition-colors text-gray-700 hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
									key={relationshipOption}
									value={relationshipOption}
								>
									{relationshipOption}
								</DropdownMenu.RadioItem>
							))}
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Arrow className="fill-white" />
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		);
	},
);
TextOperator.displayName = "AppliedFilter.TextOperator";

// ============================================================================
// Value Component (for radio/checkbox filters)
// ============================================================================

interface ValueProps {
	className?: string;
}

const Value = forwardRef<HTMLButtonElement, ValueProps>(
	({ className, ...props }, forwardedRef) => {
		const { filter, chipHeight } = useAppliedFilterContext();
		const { filterCategories } = useFilters();
		const { selectionType, propertyNameSingular, propertyNamePlural, values } =
			filter;
		const category = filterCategories.find((c) => c.id === filter.categoryId);
		const [isOpen, setIsOpen] = useState(false);
		const buttonRef = useRef<HTMLButtonElement | null>(null);
		const [triggerPosition, setTriggerPosition] = useState<{
			top: number;
			left: number;
		} | null>(null);

		// Merge refs using callback ref pattern
		const setRefs = (el: HTMLButtonElement | null) => {
			buttonRef.current = el;
			if (typeof forwardedRef === "function") {
				forwardedRef(el);
			} else if (forwardedRef) {
				(
					forwardedRef as React.MutableRefObject<HTMLButtonElement | null>
				).current = el;
			}
		};

		if (!category) {
			console.error("Category not found");
			return null;
		}
		const propertyNameToDisplay =
			selectionType === SELECTION_TYPES.RADIO
				? propertyNameSingular
				: propertyNamePlural;

		const selectedOptionsLabel =
			values.length > 0 ? values.map((v) => v.label).join(", ") : "...";

		const handleOpenChange = (open: boolean) => {
			if (open && buttonRef.current) {
				// Capture the button's position when opening
				const rect = buttonRef.current.getBoundingClientRect();
				setTriggerPosition({
					top: rect.top,
					left: rect.left,
				});
			}
			setIsOpen(open);
		};

		return (
			<DropdownMenu.Root
				modal={false}
				open={isOpen}
				onOpenChange={handleOpenChange}
			>
				{/* Invisible trigger positioned at the captured location */}
				{isOpen && triggerPosition ? (
					<DropdownMenu.Trigger asChild>
						<div
							className="fixed w-0 h-0 pointer-events-none"
							style={{
								top: triggerPosition.top,
								left: triggerPosition.left,
							}}
						/>
					</DropdownMenu.Trigger>
				) : null}

				{/* Visible button that acts as the interactive element */}
				<Toolbar.Button asChild>
					<button
						ref={setRefs}
						type="button"
						onClick={() => handleOpenChange(!isOpen)}
						aria-haspopup="menu"
						aria-expanded={isOpen}
						className={twMerge(
							"h-full px-2 whitespace-nowrap cursor-pointer border-r border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1",
							CHIP_TEXT_SIZE_VARIANTS[chipHeight],
							className,
						)}
						aria-label={`Filter by ${propertyNameToDisplay}`}
						{...props}
					>
						{selectedOptionsLabel}
					</button>
				</Toolbar.Button>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						sideOffset={40}
						onCloseAutoFocus={(event) => {
							event.preventDefault();
							buttonRef.current?.focus();
						}}
						className="border border-gray-200 min-w-[220px] rounded-lg bg-white shadow-lg will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
					>
						<FilterDropdownSubCategory
							standalone
							key={`applied-filter-subcategory-${filter.id}`}
							categoryId={category.id}
							filterId={filter.id}
						/>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		);
	},
);
Value.displayName = "AppliedFilter.Value";

// ============================================================================
// TextValue Component (for text filters)
// ============================================================================

interface TextValueProps {
	className?: string;
}

const TextValue = forwardRef<HTMLButtonElement, TextValueProps>(
	({ className, ...props }, ref) => {
		const { filter, chipHeight } = useAppliedFilterContext();
		const { updateTextFilterValue } = useFilters();
		const [isEditing, setIsEditing] = useState(false);
		const [editValue, setEditValue] = useState(
			filter.selectionType === SELECTION_TYPES.TEXT ? filter.textValue : "",
		);
		const inputRef = useRef<HTMLInputElement>(null);

		// Focus input when editing starts
		useEffect(() => {
			if (isEditing && inputRef.current) {
				inputRef.current.focus();
				inputRef.current.select();
			}
		}, [isEditing]);

		const handleCommit = () => {
			if (filter.selectionType === SELECTION_TYPES.TEXT) {
				updateTextFilterValue(filter.id, editValue.trim());
			}
			setIsEditing(false);
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleCommit();
			} else if (e.key === "Escape") {
				e.preventDefault();
				// Reset to original value
				if (filter.selectionType === SELECTION_TYPES.TEXT) {
					setEditValue(filter.textValue);
				}
				setIsEditing(false);
			}
		};

		const displayValue =
			filter.selectionType === SELECTION_TYPES.TEXT
				? filter.textValue || "..."
				: "...";

		if (isEditing) {
			return (
				<input
					ref={inputRef}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleCommit}
					onKeyDown={handleKeyDown}
					className={twMerge(
						"h-full px-2 min-w-[100px] max-w-[200px] border-r border-slate-200 outline-none text-sm focus:ring-2 focus:ring-slate-400 focus:ring-inset",
						CHIP_TEXT_SIZE_VARIANTS[chipHeight],
						className,
					)}
					aria-label="Filter text value"
				/>
			);
		}

		return (
			<Toolbar.Button asChild>
				<button
					ref={ref}
					type="button"
					onClick={() => setIsEditing(true)}
					className={twMerge(
						"h-full px-2 whitespace-nowrap cursor-pointer border-r border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 max-w-[200px] truncate",
						CHIP_TEXT_SIZE_VARIANTS[chipHeight],
						className,
					)}
					aria-label="Edit filter text value"
					{...props}
				>
					{displayValue}
				</button>
			</Toolbar.Button>
		);
	},
);
TextValue.displayName = "AppliedFilter.TextValue";

// ============================================================================
// RemoveButton Component
// ============================================================================

interface RemoveButtonProps {
	children?: React.ReactNode;
	className?: string;
}

const RemoveButton = forwardRef<HTMLButtonElement, RemoveButtonProps>(
	({ children, className, ...props }, ref) => {
		const {
			filter,
			chipHeight,
			removeButtonRef,
			onRemove,
			onRemoveButtonRightArrow,
		} = useAppliedFilterContext();
		const { removeFilter } = useFilters();

		// Merge refs
		const setRefs = (el: HTMLButtonElement | null) => {
			if (typeof ref === "function") {
				ref(el);
			} else if (ref) {
				(ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
			}
			removeButtonRef?.(el);
		};

		const handleRemove = () => {
			if (onRemove) {
				onRemove();
			} else {
				removeFilter(filter.id);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
			// Delete filter on Backspace or Enter when focused on the X button
			if (e.key === "Backspace" || e.key === "Enter") {
				e.preventDefault();
				handleRemove();
			}
			// Custom right arrow navigation (e.g., to exit toolbar and focus input)
			if (e.key === "ArrowRight" && onRemoveButtonRightArrow) {
				e.preventDefault();
				e.stopPropagation();
				onRemoveButtonRightArrow();
			}
		};

		const iconSize =
			chipHeight === "sm"
				? "w-3 h-3"
				: chipHeight === "md"
					? "w-4 h-4"
					: "w-5 h-5";

		return (
			<Toolbar.Button asChild>
				<button
					ref={setRefs}
					type="button"
					className={twMerge(
						"h-full px-2 rounded-tr rounded-br text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1",
						className,
					)}
					onClick={handleRemove}
					onKeyDown={handleKeyDown}
					aria-label="Remove filter"
					data-testid="remove-filter"
					{...props}
				>
					{children ?? <X className={iconSize} aria-hidden="true" />}
				</button>
			</Toolbar.Button>
		);
	},
);
RemoveButton.displayName = "AppliedFilter.RemoveButton";

// ============================================================================
// Compound Component Export
// ============================================================================

/**
 * AppliedFilter compound component for building flexible filter chips.
 *
 * @example
 * ```tsx
 * // Compositional usage
 * <AppliedFilter.Root filter={filter} chipHeight="sm">
 *   <AppliedFilter.Label />
 *   <AppliedFilter.Operator />
 *   <AppliedFilter.Value />
 *   <AppliedFilter.RemoveButton />
 * </AppliedFilter.Root>
 *
 * // Text filter variant
 * <AppliedFilter.Root filter={filter}>
 *   <AppliedFilter.Label />
 *   <AppliedFilter.Operator />
 *   <AppliedFilter.TextValue />
 *   <AppliedFilter.RemoveButton />
 * </AppliedFilter.Root>
 * ```
 *
 * Required structure:
 * - Root must wrap all sub-components
 * - Label displays the filter property name
 * - Operator shows the relationship dropdown (is, is not, etc.)
 * - Value (for radio/checkbox) or TextValue (for text filters) shows the selected values
 * - RemoveButton allows removing the filter
 */
export const AppliedFilter = {
	Root,
	Label,
	Operator,
	TextOperator,
	Value,
	TextValue,
	RemoveButton,
};

// ============================================================================
// Convenience Wrapper (preserves existing API)
// ============================================================================

interface AppliedFilterWrapperProps {
	filter: TAppliedFilter;
	/** Callback to register the remove button ref for focus management */
	removeButtonRef?: (el: HTMLButtonElement | null) => void;
	/** Custom remove handler that handles focus management */
	onRemove?: () => void;
	/** Callback when right arrow is pressed on the remove button (for custom navigation) */
	onRemoveButtonRightArrow?: () => void;
	/** If true, left arrow on the operator button won't navigate (prevents wrap) */
	preventOperatorLeftWrap?: boolean;
	/** Height variant for the chip. Defaults to "md" (36px). */
	chipHeight?: ChipHeight;
}

/**
 * Convenience wrapper that provides the traditional props-based API.
 * Internally uses the compound components.
 */
const AppliedFilterWrapper = memo(
	({
		filter,
		removeButtonRef,
		onRemove,
		onRemoveButtonRightArrow,
		preventOperatorLeftWrap,
		chipHeight = "md",
	}: AppliedFilterWrapperProps) => {
		const isTextFilter = filter.selectionType === SELECTION_TYPES.TEXT;

		return (
			<AppliedFilter.Root
				filter={filter}
				chipHeight={chipHeight}
				preventOperatorLeftWrap={preventOperatorLeftWrap}
				removeButtonRef={removeButtonRef}
				onRemove={onRemove}
				onRemoveButtonRightArrow={onRemoveButtonRightArrow}
			>
				<AppliedFilter.Label />
				<AppliedFilter.Operator />
				{isTextFilter ? <AppliedFilter.TextValue /> : <AppliedFilter.Value />}
				<AppliedFilter.RemoveButton />
			</AppliedFilter.Root>
		);
	},
);
AppliedFilterWrapper.displayName = "AppliedFilter";

// Default export for backward compatibility
export default AppliedFilterWrapper;

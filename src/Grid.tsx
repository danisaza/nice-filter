import { X } from "lucide-react";
import type { Row } from "./App";
import { Button } from "./components/ui/button";
import {
	CHECKBOX_SELECTION_RELATIONSHIPS,
	MATCH_TYPES,
	type MatchType,
	RADIO_SELECTION_RELATIONSHIPS,
	RELATIONSHIP_TYPES,
	RELATIONSHIPS,
	type Relationship,
	type RelationshipType,
	type TAppliedFilter,
} from "./hooks/constants";
import useFilters from "./hooks/useFilters";

export default function Grid({ rows }: { rows: Row[] }) {
	const { filters, matchType, removeAllFilters } = useFilters();
	const filteredRows = filterRows(rows, filters, matchType);
	const numRowsHidden = rows.length - filteredRows.length;
	return (
		<div className="w-full">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
				{filteredRows.map((row) => (
					<div
						key={row.id}
						className="bg-white rounded-lg p-4 border border-gray-200"
					>
						{/* Header with Priority and Status */}
						<div className="flex justify-between items-center mb-3">
							<span
								className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(row.priority)}`}
							>
								{row.priority}
							</span>
							<span
								className={`px-2 py-1 rounded-full text-sm ${getStatusColor(row.status)}`}
							>
								{row.status}
							</span>
						</div>

						{/* Task Text */}
						<h3 className="font-medium text-lg mb-3">{row.text}</h3>

						{/* Tags */}
						<div className="flex flex-wrap gap-1 mb-3">
							{row.tags.map((tag) => (
								<span
									key={tag}
									className="bg-gray-100 px-2 py-1 rounded-md text-sm"
								>
									{tag}
								</span>
							))}
						</div>

						{/* Assignee */}
						<div className="flex items-center gap-2 text-gray-600">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Assignee</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							<span className="text-sm">{row.assignee}</span>
						</div>
					</div>
				))}
			</div>
			{numRowsHidden > 0 ? (
				<div className="flex justify-center items-center gap-4">
					<div className="text-sm text-gray-500">
						<span className="font-bold">
							{numRowsHidden} {numRowsHidden === 1 ? "item" : "items"}
						</span>{" "}
						hidden by filters
					</div>
					<Button
						variant="outline"
						onClick={() => {
							removeAllFilters();
						}}
					>
						Clear filters <X />
					</Button>
				</div>
			) : null}
		</div>
	);
}

function filterRows(
	rows: Row[],
	filters: TAppliedFilter[],
	matchType: MatchType,
) {
	if (filters.length === 0) {
		return rows;
	}
	return matchType === MATCH_TYPES.ALL
		? filterRowsByAll(rows, filters)
		: filterRowsByAny(rows, filters);
}

function filterRowsByAll(rows: Row[], filters: TAppliedFilter[]) {
	return rows.filter((row) => {
		return filters.every((filter) => {
			return filterRow(row, filter);
		});
	});
}

function filterRowsByAny(rows: Row[], filters: TAppliedFilter[]) {
	return rows.filter((row) => {
		return filters.some((filter) => {
			return filterRow(row, filter);
		});
	});
}

const GETTERS = {
	status: (row: Row) => row.status,
	priority: (row: Row) => row.priority,
	tag: (row: Row) => row.tags,
	assignee: (row: Row) => row.assignee,
};

/** Returns `true` if the row should be displayed, according to the filter.
 *
 *  If an error is encountered, it returns `true` so that the row is still displayed */
function filterRow(row: Row, filter: TAppliedFilter) {
	const getter: (row: Row) => any =
		GETTERS[filter.propertyNameSingular as keyof typeof GETTERS] ??
		(() =>
			row[filter.propertyNameSingular as keyof Row] ??
			row[filter.propertyNamePlural as keyof Row]);
	const selectionType: RelationshipType = filter.selectionType;
	if (
		selectionType !== RELATIONSHIP_TYPES.RADIO &&
		selectionType !== RELATIONSHIP_TYPES.CHECKBOXES
	) {
		console.error(`Invalid selection type: ${selectionType}`);
		return true;
	}

	// if there are zero values selected, it's equivalent to not having the filter applied
	if (filter.values.length === 0) {
		return true;
	}

	if (selectionType === RELATIONSHIP_TYPES.RADIO) {
		const relationshipOptions: readonly Relationship[] =
			filter.values.length <= 1
				? RADIO_SELECTION_RELATIONSHIPS["ONE"]
				: RADIO_SELECTION_RELATIONSHIPS["MANY"];
		const isRelationshipValid = relationshipOptions.includes(
			filter.relationship,
		);
		if (!isRelationshipValid) {
			console.error(`Invalid relationship: ${filter.relationship}`);
			return true; // default to true so that at least the user can see the row
		}

		const rowValue = getter(row);
		if (filter.relationship === RELATIONSHIPS.IS) {
			if (filter.values.length !== 1) {
				console.error(
					`Invalid number of values for relationship ${filter.relationship}: ${filter.values.length}`,
				);
				return filter.values.some((value) => rowValue === value.value); // sensible default
			}
			return rowValue === filter.values[0].value;
		}

		if (filter.relationship === RELATIONSHIPS.IS_ANY_OF) {
			return filter.values.some((value) => rowValue === value.value);
		}

		if (filter.relationship === RELATIONSHIPS.IS_NOT) {
			return !filter.values.some((value) => rowValue === value.value);
		}

		console.error(`Invalid relationship: ${filter.relationship}`);
		return true;
	} else if (selectionType === RELATIONSHIP_TYPES.CHECKBOXES) {
		const relationshipOptions: readonly Relationship[] =
			filter.values.length === 1
				? CHECKBOX_SELECTION_RELATIONSHIPS["ONE"]
				: CHECKBOX_SELECTION_RELATIONSHIPS["MANY"];
		const isRelationshipValid = relationshipOptions.includes(
			filter.relationship,
		);
		if (!isRelationshipValid) {
			console.error(`Invalid relationship: ${filter.relationship}`);
			return true; // default to true so that at least the user can see the row
		}

		const rowValues = getter(row);
		if (filter.relationship === RELATIONSHIPS.INCLUDE) {
			return filter.values.some((value) => rowValues.includes(value.value));
		}

		if (filter.relationship === RELATIONSHIPS.DO_NOT_INCLUDE) {
			return !filter.values.some((value) => rowValues.includes(value.value));
		}

		if (filter.relationship === RELATIONSHIPS.INCLUDE_ALL_OF) {
			return filter.values.every((value) => rowValues.includes(value.value));
		}

		if (filter.relationship === RELATIONSHIPS.INCLUDE_ANY_OF) {
			return filter.values.some((value) => rowValues.includes(value.value));
		}

		if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ALL) {
			return !filter.values.every((value) => rowValues.includes(value.value));
		}

		if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ANY_OF) {
			return !filter.values.some((value) => rowValues.includes(value.value));
		}

		console.error(`Invalid relationship: ${filter.relationship}`);
		return true;
	} else {
		console.error(`Invalid selection type: ${selectionType}`);
		return true;
	}
}

// Helper functions for color classes
function getPriorityColor(priority: Priority): string {
	const colors = {
		Low: "bg-green-100 text-green-800",
		Medium: "bg-yellow-100 text-yellow-800",
		High: "bg-red-100 text-red-800",
	};
	return colors[priority];
}

function getStatusColor(status: Status): string {
	const colors = {
		"Not Started": "bg-gray-100 text-gray-800",
		"In Progress": "bg-blue-100 text-blue-800",
		Completed: "bg-green-100 text-green-800",
		Cancelled: "bg-red-100 text-red-800",
	};
	return colors[status];
}

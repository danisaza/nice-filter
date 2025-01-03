import { X } from 'lucide-react';
import './App.css'
import { Button } from './components/ui/button';
import Filters, { FilterOption } from './Filters'
import useFilters, { FiltersProvider, Option, RELATIONSHIP_TYPES, RELATIONSHIPS, RelationshipType, RADIO_SELECTION_RELATIONSHIPS, TAppliedFilter, CHECKBOX_SELECTION_RELATIONSHIPS, Relationship, MatchType, MATCH_TYPES } from './hooks/useFilters'

type Status = "Not Started" | "In Progress" | "Completed" | "Cancelled";
type Priority = "Low" | "Medium" | "High";
type Tag = "Bug" | "Feature" | "Documentation" | "Refactoring" | "Testing" | "Other";
type Assignee = "John Doe" | "Jane Smith" | "Alice Johnson" | "Bob Brown";

type Row = {
  id: string;
  text: string;
  status: Status;
  tags: Tag[];
  assignee: Assignee;
  priority: Priority;
}

const STATUS_OPTIONS: Option[] = [
  { label: "Not Started", value: "Not Started", id: "1" },
  { label: "In Progress", value: "In Progress", id: "2" },
  { label: "Completed", value: "Completed", id: "3" },
  { label: "Cancelled", value: "Cancelled", id: "4" },
]

const PRIORITY_OPTIONS: Option[] = [
  { label: "Low", value: "Low", id: "1" },
  { label: "Medium", value: "Medium", id: "2" },
  { label: "High", value: "High", id: "3" },
]

const TAGS: Option[] = [
  { label: "Bug", value: "Bug", id: "1" },
  { label: "Feature", value: "Feature", id: "2" },
  { label: "Documentation", value: "Documentation", id: "3" },
  { label: "Refactoring", value: "Refactoring", id: "4" },
  { label: "Testing", value: "Testing", id: "5" },
  { label: "Other", value: "Other", id: "6" },
]

const ASSIGNEE_OPTIONS: Option[] = [
  { label: "John Doe", value: "John Doe", id: "1" },
  { label: "Jane Smith", value: "Jane Smith", id: "2" },
  { label: "Alice Johnson", value: "Alice Johnson", id: "3" },
  { label: "Bob Brown", value: "Bob Brown", id: "4" },
]

const FILTER_CATEGORIES: FilterOption[] = [
  { id: "status", selectionType: RELATIONSHIP_TYPES.RADIO, propertyNameSingular: "status", propertyNamePlural: "statuses", options: STATUS_OPTIONS },
  { id: "priority", selectionType: RELATIONSHIP_TYPES.RADIO, propertyNameSingular: "priority", propertyNamePlural: "priorities", options: PRIORITY_OPTIONS },
  { id: "tags", selectionType: RELATIONSHIP_TYPES.CHECKBOXES, propertyNameSingular: "tag", propertyNamePlural: "tags", options: TAGS },
  { id: "assignee", selectionType: RELATIONSHIP_TYPES.RADIO, propertyNameSingular: "assignee", propertyNamePlural: "assignees", options: ASSIGNEE_OPTIONS },
];

const ROWS: Row[] = [
  { id: "1", text: "Add polish to this page", status: "Not Started", tags: ["Bug", "Documentation"], assignee: "John Doe", priority: "Low" },
  { id: "2", text: "Add dark mode", status: "In Progress", tags: ["Feature", "Refactoring"], assignee: "Jane Smith", priority: "Medium" },
  { id: "3", text: "Do performance tuning", status: "Completed", tags: ["Documentation"], assignee: "Alice Johnson", priority: "High" },
  { id: "4", text: "Refactor the code", status: "Cancelled", tags: ["Refactoring"], assignee: "Bob Brown", priority: "Low" },
  { id: "5", text: "Fix the login page bug", status: "Not Started", tags: ["Bug", "Documentation"], assignee: "John Doe", priority: "Low" },
  { id: "6", text: "Add user impersonation", status: "In Progress", tags: ["Feature", "Refactoring"], assignee: "Jane Smith", priority: "Medium" },
  { id: "7", text: "Write API documentation", status: "Completed", tags: ["Documentation"], assignee: "Alice Johnson", priority: "High" },
  { id: "8", text: "Refactor authentication code", status: "Cancelled", tags: ["Refactoring"], assignee: "Bob Brown", priority: "Low" },
  { id: "9", text: "Fix performance bug", status: "Not Started", tags: ["Bug", "Documentation"], assignee: "John Doe", priority: "Low" },
  { id: "10", text: "Add export functionality", status: "In Progress", tags: ["Feature", "Refactoring"], assignee: "Jane Smith", priority: "Medium" },
  { id: "11", text: "Write user guide", status: "Completed", tags: ["Documentation"], assignee: "Alice Johnson", priority: "High" },
  { id: "12", text: "Refactor database queries", status: "Cancelled", tags: ["Refactoring"], assignee: "Bob Brown", priority: "Low" },
  { id: "13", text: "Fix mobile layout bug", status: "Not Started", tags: ["Bug", "Documentation"], assignee: "John Doe", priority: "Low" },
  { id: "14", text: "Add search feature", status: "In Progress", tags: ["Feature", "Refactoring"], assignee: "Jane Smith", priority: "Medium" },
  { id: "15", text: "Write release notes", status: "Completed", tags: ["Documentation"], assignee: "Alice Johnson", priority: "High" },
  { id: "16", text: "Clean up styling", status: "Cancelled", tags: ["Refactoring"], assignee: "Bob Brown", priority: "Low" },
  { id: "17", text: "Another one!", status: "Completed", tags: ["Bug", "Feature"], assignee: "Bob Brown", priority: "Low" },
];

export default function App() {
  return (
    <FiltersProvider>
      <Filters filterCategories={FILTER_CATEGORIES} />
      <Table rows={ROWS} />
    </FiltersProvider>
  )
}

function Table({ rows }: { rows: Row[] }) {
  const { filters, matchType, removeAllFilters } = useFilters();
  const filteredRows = filterRows(rows, filters, matchType);
  const numRowsHidden = rows.length - filteredRows.length;
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredRows.map(row => (
          <div key={row.id} className="bg-white shadow-md rounded-lg p-4 border">
            {/* Header with Priority and Status */}
            <div className="flex justify-between items-center mb-3">
              <span className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(row.priority)}`}>
                {row.priority}
              </span>
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(row.status)}`}>
                {row.status}
              </span>
            </div>

            {/* Task Text */}
            <h3 className="font-medium text-lg mb-3">{row.text}</h3>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {row.tags.map(tag => (
                <span key={tag} className="bg-gray-100 px-2 py-1 rounded-md text-sm">
                  {tag}
                </span>
              ))}
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">{row.assignee}</span>
            </div>
          </div>
        ))}
      </div>
      {numRowsHidden > 0 ? <div className="flex justify-center items-center gap-4">
        <div className="text-sm text-gray-500">
          <span className="font-bold">{numRowsHidden} {numRowsHidden === 1 ? "item" : "items"}</span> hidden by filters
        </div>
        <Button variant="outline" onClick={() => {
          removeAllFilters();
        }}>
          Clear filters <X />
        </Button>
      </div> : null}
    </div>
  )
}

function filterRows(rows: Row[], filters: TAppliedFilter[], matchType: MatchType) {
  if (filters.length === 0) {
    return rows;
  }
  return matchType === MATCH_TYPES.ALL ? filterRowsByAll(rows, filters) : filterRowsByAny(rows, filters);
}

function filterRowsByAll(rows: Row[], filters: TAppliedFilter[]) {
  return rows.filter(row => {
    return filters.every(filter => {
      return filterRow(row, filter);
    });
  });
}

function filterRowsByAny(rows: Row[], filters: TAppliedFilter[]) {
  return rows.filter(row => {
    return filters.some(filter => {
      return filterRow(row, filter);
    });
  });
}

const GETTERS = {
  status: (row: Row) => row.status,
  priority: (row: Row) => row.priority,
  tag: (row: Row) => row.tags,
  assignee: (row: Row) => row.assignee,
}

/** Returns `true` if the row should be displayed, according to the filter.
 *
 *  If an error is encountered, it returns `true` so that the row is still displayed */
function filterRow(row: Row, filter: TAppliedFilter) {
  const getter: (row: Row) => any = GETTERS[filter.propertyNameSingular as keyof typeof GETTERS] ?? (() => row[filter.propertyNameSingular as keyof Row] ?? row[filter.propertyNamePlural as keyof Row]);
  const selectionType: RelationshipType = filter.selectionType;
  if (selectionType !== RELATIONSHIP_TYPES.RADIO && selectionType !== RELATIONSHIP_TYPES.CHECKBOXES) {
    console.error(`Invalid selection type: ${selectionType}`);
    return true;
  }

  // if there are zero values selected, it's equivalent to not having the filter applied
  if (filter.values.length === 0) {
    return true;
  }

  if (selectionType === RELATIONSHIP_TYPES.RADIO) {
    const relationshipOptions: readonly Relationship[] = filter.values.length <= 1 ? RADIO_SELECTION_RELATIONSHIPS["ONE"] : RADIO_SELECTION_RELATIONSHIPS["MANY"];
    const isRelationshipValid = relationshipOptions.includes(filter.relationship);
    if (!isRelationshipValid) {
      console.error(`Invalid relationship: ${filter.relationship}`);
      return true; // default to true so that at least the user can see the row
    }

    const rowValue = getter(row);
    if (filter.relationship === RELATIONSHIPS.IS) {
      if (filter.values.length !== 1) {
        console.error(`Invalid number of values for relationship ${filter.relationship}: ${filter.values.length}`);
        return filter.values.some(value => rowValue === value.value); // sensible default
      }
      return rowValue === filter.values[0].value;
    }

    if (filter.relationship === RELATIONSHIPS.IS_ANY_OF) {
      return filter.values.some(value => rowValue === value.value);
    }

    if (filter.relationship === RELATIONSHIPS.IS_NOT) {
      return !filter.values.some(value => rowValue === value.value);
    }

    console.error(`Invalid relationship: ${filter.relationship}`);
    return true;
  } else if (selectionType === RELATIONSHIP_TYPES.CHECKBOXES) {
    const relationshipOptions: readonly Relationship[] = filter.values.length === 1 ? CHECKBOX_SELECTION_RELATIONSHIPS["ONE"] : CHECKBOX_SELECTION_RELATIONSHIPS["MANY"];
    const isRelationshipValid = relationshipOptions.includes(filter.relationship);
    if (!isRelationshipValid) {
      console.error(`Invalid relationship: ${filter.relationship}`);
      return true; // default to true so that at least the user can see the row
    }

    const rowValues = getter(row);
    if (filter.relationship === RELATIONSHIPS.INCLUDE) {
      return filter.values.some(value => rowValues.includes(value.value));
    }

    if (filter.relationship === RELATIONSHIPS.DO_NOT_INCLUDE) {
      return !filter.values.some(value => rowValues.includes(value.value));
    }

    if (filter.relationship === RELATIONSHIPS.INCLUDE_ALL_OF) {
      return filter.values.every(value => rowValues.includes(value.value));
    }

    if (filter.relationship === RELATIONSHIPS.INCLUDE_ANY_OF) {
      return filter.values.some(value => rowValues.includes(value.value));
    }

    if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ALL) {
      return !filter.values.every(value => rowValues.includes(value.value));
    }

    if (filter.relationship === RELATIONSHIPS.EXCLUDE_IF_ANY_OF) {
      return !filter.values.some(value => rowValues.includes(value.value));
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
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-red-100 text-red-800'
  };
  return colors[priority];
}

function getStatusColor(status: Status): string {
  const colors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };
  return colors[status];
}

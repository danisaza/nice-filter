import './App.css'
import Filters, { FilterOption } from './Filters'
import { FiltersProvider, Option, RELATIONSHIP_TYPES } from './hooks/useFilters'
import Grid from './Grid';

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
      <Grid rows={ROWS} />
    </FiltersProvider>
  )
}

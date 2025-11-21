import { X } from "lucide-react";
import type { Priority, Status } from "@/App";
import { useFilters } from "@/App";
import { Button } from "./components/ui/button";

export default function Grid() {
	const { removeAllFilters, filteredRows, hiddenRowCount } = useFilters();
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
			{hiddenRowCount > 0 ? (
				<div className="flex justify-center items-center gap-4 mt-4">
					<div className="text-sm text-gray-500">
						<span className="font-bold">
							{hiddenRowCount} {hiddenRowCount === 1 ? "item" : "items"}
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

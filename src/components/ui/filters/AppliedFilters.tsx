import useFilters from "@/hooks/useFilters";
import AppliedFilter from "./AppliedFilter";

const AppliedFilters = ({
	before,
	after,
}:
	| { before: number; after?: undefined }
	| { before?: undefined; after: number }) => {
	const { filters } = useFilters();

	console.log("[exp] after", after);

	console.log("[exp] filters", filters);

	const filtersToDisplay = filters.filter((filter) => {
		if (before) {
			return filter.createdAt < before;
		}
		if (after) {
			return filter.createdAt > after;
		}
		return true;
	});

	return (
		<div className="contents">
			{filtersToDisplay
				.sort((a, b) => a.createdAt - b.createdAt)
				.map((filter) => {
					return <AppliedFilter key={filter.id} id={filter.id} />;
				})}
		</div>
	);
};

export default AppliedFilters;

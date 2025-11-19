import useFilters from "@/hooks/useFilters";
import AppliedFilter from "./AppliedFilter";

export default function AppliedFilters() {
	const { filters, nextFilterId } = useFilters();
	const finalizedFilters = filters.filter((f) => f.id !== nextFilterId);
	return (
		<div className="contents">
			{finalizedFilters.map((filter) => {
				return <AppliedFilter key={filter.id} id={filter.id} />;
			})}
		</div>
	);
}

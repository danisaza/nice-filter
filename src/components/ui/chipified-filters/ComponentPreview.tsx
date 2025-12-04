import { ChipFilterInput } from "./ChipFilterInput";

export const ComponentPreview = () => {
	return (
		<div className="max-w-4xl mx-auto space-y-12">
			{/* GitHub-style Example */}
			<section>
				<ChipFilterInput placeholder="Filter issues by status, author, label..." />
			</section>
		</div>
	);
};

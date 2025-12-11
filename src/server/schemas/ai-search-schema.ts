import { z } from "zod";

/**
 * Schema for AI-generated search terms.
 *
 * The AI generates search terms (not final filters) in a single call.
 * The backend then uses these terms to fuzzy-match against columns and values
 * from the filter configuration.
 */
export const AISearchTermsSchema = z.object({
	filters: z.array(
		z.object({
			// Terms to fuzzy-match against column names (e.g., ["status", "state", "progress"])
			columnSearchTerms: z
				.array(z.string())
				.describe(
					"Synonyms or related terms to match against column/property names",
				),
			// Terms to fuzzy-match against values in that column (e.g., ["done", "complete", "finished"])
			valueSearchTerms: z
				.array(z.string())
				.describe("Synonyms or related terms to match against column values"),
			// Is this a negation? (e.g., "NOT completed", "exclude high priority")
			isNegation: z
				.boolean()
				.optional()
				.describe(
					"True if the user wants to exclude/negate this filter (e.g., 'not completed', 'exclude bugs')",
				),
		}),
	),
	// Overall match type for combining filters
	matchType: z
		.enum(["all", "any"])
		.optional()
		.describe(
			"How to combine filters: 'all' = AND logic (default), 'any' = OR logic",
		),
});

export type AISearchTerms = z.infer<typeof AISearchTermsSchema>;

import { createContext, type ReactNode, useContext, useState } from "react";
import type { UseStateSetter } from "@/utils";

type NewFilterCreatedAtCutoffContextType = {
	newFilterCreatedAtCutoff: number;
	setNewFilterCreatedAtCutoff: UseStateSetter<number>;
};

const NewFilterCreatedAtCutoffContext =
	createContext<NewFilterCreatedAtCutoffContextType | null>(null);

export function NewFilterCreatedAtCutoffProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [newFilterCreatedAtCutoff, setNewFilterCreatedAtCutoff] =
		useState<number>(() => Date.now());

	const value: NewFilterCreatedAtCutoffContextType = {
		newFilterCreatedAtCutoff,
		setNewFilterCreatedAtCutoff,
	};

	return (
		<NewFilterCreatedAtCutoffContext.Provider value={value}>
			{children}
		</NewFilterCreatedAtCutoffContext.Provider>
	);
}

export default function useNewFilterCreatedAtCutoff() {
	const context = useContext(NewFilterCreatedAtCutoffContext);
	if (!context) {
		throw new Error(
			"useNewFilterCreatedAtCutoff must be used within a NewFilterCreatedAtCutoffProvider",
		);
	}

	return context;
}

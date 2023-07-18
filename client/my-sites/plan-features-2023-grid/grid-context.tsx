import { createContext, useContext } from '@wordpress/element';
import type { GridPlan, PlansIntent } from './hooks/npm-ready/data-store/use-grid-plans';

interface PlansGridContext {
	intent?: PlansIntent;
	gridPlans: GridPlan[];
	gridPlansIndex: { [ key: string ]: GridPlan };
}

const PlansGridContext = createContext< PlansGridContext >( {} as PlansGridContext );

interface PlansGridContextProviderProps {
	intent?: PlansIntent;
	gridPlans: GridPlan[];
	children: React.ReactNode;
}

const PlansGridContextProvider = ( {
	intent,
	gridPlans,
	children,
}: PlansGridContextProviderProps ) => {
	const gridPlansIndex = gridPlans.reduce(
		( acc, gridPlan ) => ( {
			...acc,
			[ gridPlan.planSlug ]: gridPlan,
		} ),
		{}
	);

	return (
		<PlansGridContext.Provider value={ { intent, gridPlans, gridPlansIndex } }>
			{ children }
		</PlansGridContext.Provider>
	);
};

export const usePlansGridContext = (): PlansGridContext => useContext( PlansGridContext );

export type { PlansIntent };

export default PlansGridContextProvider;

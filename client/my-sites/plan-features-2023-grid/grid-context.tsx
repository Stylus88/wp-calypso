import { createContext, useContext } from '@wordpress/element';
import type { UsePricingMetaForGridPlans } from '.';
import type { GridPlan, PlansIntent } from './hooks/npm-ready/data-store/use-grid-plans';

interface PlansGridContext {
	intent?: PlansIntent;
	gridPlans: GridPlan[];
	gridPlansIndex: { [ key: string ]: GridPlan };
	helpers?: Record< 'usePricingMetaForGridPlans', UsePricingMetaForGridPlans >;
}

const PlansGridContext = createContext< PlansGridContext >( {} as PlansGridContext );

interface PlansGridContextProviderProps {
	intent?: PlansIntent;
	gridPlans: GridPlan[];
	usePricingMetaForGridPlans: UsePricingMetaForGridPlans;
	children: React.ReactNode;
}

const PlansGridContextProvider = ( {
	intent,
	gridPlans,
	usePricingMetaForGridPlans,
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
		<PlansGridContext.Provider
			value={ {
				intent,
				gridPlans,
				gridPlansIndex,
				helpers: { usePricingMetaForGridPlans },
			} }
		>
			{ children }
		</PlansGridContext.Provider>
	);
};

export const usePlansGridContext = (): PlansGridContext => useContext( PlansGridContext );

export type { PlansIntent };

export default PlansGridContextProvider;

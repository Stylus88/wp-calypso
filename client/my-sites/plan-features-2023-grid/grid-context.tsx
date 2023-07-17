import { PlanSlug } from '@automattic/calypso-products';
import { createContext, useContext } from '@wordpress/element';
import type {
	GridPlan,
	PlansIntent,
} from './hooks/npm-ready/data-store/use-grid-plans-with-intent';

interface PlansGridContext {
	intent?: PlansIntent;
	planRecords: Record< PlanSlug, GridPlan >;
}

const PlansGridContext = createContext< PlansGridContext >( {} as PlansGridContext );

const PlansGridContextProvider: React.FunctionComponent<
	PlansGridContext & { children: React.ReactNode }
> = ( { intent, planRecords, children } ) => {
	return (
		<PlansGridContext.Provider value={ { intent, planRecords } }>
			{ children }
		</PlansGridContext.Provider>
	);
};

export const usePlansGridContext = (): PlansGridContext => useContext( PlansGridContext );

export type { PlansIntent };

export default PlansGridContextProvider;

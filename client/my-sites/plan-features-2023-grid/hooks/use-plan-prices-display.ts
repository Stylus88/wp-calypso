import { useSelector } from 'calypso/state';
import { getPlanPrices } from 'calypso/state/plans/selectors';
import {
	getSitePlanRawPrice,
	isPlanAvailableForPurchase,
} from 'calypso/state/sites/plans/selectors';
import type { PlanSlug } from '@automattic/calypso-products';

interface Props {
	planSlug: PlanSlug;
	returnMonthly: boolean; // defaults to true
	siteId?: number | null;
	currentSitePlanSlug?: string | null;
	withoutProRatedCredits?: boolean;
}

/**
 * Returns the original and discounted prices to be displayed for a particular plan slug.
 * If the planSlug is the current plan or if the planSlug is not available for purchase,
 * we will always show the original price.
 */
export function usePlanPricesDisplay( {
	planSlug,
	returnMonthly,
	siteId,
	currentSitePlanSlug,
	withoutProRatedCredits,
}: Props ): {
	rawPrice: number | null;
	originalPrice: number;
	discountedPrice: number;
} {
	const planPrices = useSelector( ( state ) =>
		getPlanPrices( state, { planSlug, siteId: siteId || null, returnMonthly } )
	);
	const sitePlanRawPrice = useSelector( ( state ) => {
		if ( ! siteId ) {
			return 0;
		}
		return getSitePlanRawPrice( state, siteId, planSlug, { returnMonthly } ) || 0;
	} );
	const availableForPurchase = useSelector(
		( state ) =>
			! currentSitePlanSlug || ( siteId && isPlanAvailableForPurchase( state, siteId, planSlug ) )
	);

	if ( currentSitePlanSlug === planSlug ) {
		return {
			rawPrice: planPrices.rawPrice,
			originalPrice: sitePlanRawPrice,
			discountedPrice: 0,
		};
	}

	if ( ! availableForPurchase ) {
		return {
			rawPrice: planPrices.rawPrice,
			originalPrice: planPrices.rawPrice || 0,
			discountedPrice: 0,
		};
	}

	const discountedPrice = withoutProRatedCredits
		? planPrices.discountedRawPrice
		: planPrices.planDiscountedRawPrice || planPrices.discountedRawPrice;

	return {
		rawPrice: planPrices.rawPrice,
		originalPrice: planPrices.rawPrice || 0,
		discountedPrice,
	};
}

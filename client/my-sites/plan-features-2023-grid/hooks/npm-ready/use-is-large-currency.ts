import { usePlansGridContext } from '../../grid-context';
import type { PlanSlug } from '@automattic/calypso-products';

const LARGE_CURRENCY_CHAR_THRESHOLD = 5;

interface Props {
	planSlugs: PlanSlug[];
	returnMonthly?: boolean;
	siteId?: number | null;
}

/**
 * Hook that returns true if the string representation of any price (discounted/undiscounted)
 * of any of the plan slugs exceeds 5 characters.
 * This is primarily used for lowering the font-size of "large" display prices.
 */
export default function useIsLargeCurrency( { planSlugs, returnMonthly = true }: Props ): boolean {
	const { gridPlansIndex } = usePlansGridContext();

	return planSlugs.some( ( planSlug ) => {
		const { pricing } = gridPlansIndex[ planSlug ];

		return [
			pricing.originalPrice[ returnMonthly ? 'monthly' : 'full' ],
			pricing.discountedPrice[ returnMonthly ? 'monthly' : 'full' ],
		].some( ( price ) => price && price.toString().length > LARGE_CURRENCY_CHAR_THRESHOLD );
	} );
}

import { PRODUCT_JETPACK_STATS_MONTHLY, PRODUCT_JETPACK_STATS_PWYW_YEARLY } from './constants';

export function isJetpackStatsPaidProductSlug( productSlug: string ) {
	return (
		[ PRODUCT_JETPACK_STATS_MONTHLY, PRODUCT_JETPACK_STATS_PWYW_YEARLY ] as ReadonlyArray< string >
	 ).includes( productSlug );
}

import {
	TYPE_BLOGGER,
	TYPE_BUSINESS,
	TYPE_ECOMMERCE,
	TYPE_ENTERPRISE_GRID_WPCOM,
	TYPE_FREE,
	TYPE_PERSONAL,
	TYPE_PREMIUM,
	TYPE_WOOEXPRESS_MEDIUM,
	TYPE_WOOEXPRESS_SMALL,
	getPlan,
	isBloggerPlan,
	TERMS_LIST,
	applyTestFiltersToPlansList,
	isMonthly,
	isWpcomEnterpriseGridPlan,
	FilteredPlan,
	TERM_MONTHLY,
} from '@automattic/calypso-products';
import useHighlightLabels from './use-highlight-labels';
import usePlansFromTypes from './use-plans-from-types';
import type { PlanSlug, FeatureObject } from '@automattic/calypso-products';
import type { PricedAPIPlan } from '@automattic/data-stores';

// TODO clk: move to plans data store
export type TransformedFeatureObject = FeatureObject & {
	availableForCurrentPlan: boolean;
	availableOnlyForAnnualPlans: boolean;
};

// TODO clk: move to plans data store
export interface PlanFeatures {
	features: TransformedFeatureObject[];
	jpFeatures: TransformedFeatureObject[];
}

// TODO clk: move to types. will consume plan properties
export type GridPlan = {
	planSlug: PlanSlug;
	highlightLabel?: React.ReactNode | null;
	isVisible: boolean;
	planConstantObj: FilteredPlan;
	planName: PlanSlug;
	tagline: string;
	availableForPurchase: boolean;
	storageOptions: string[]; // optional / null ?
	product_name_short?: string | null;
	current?: boolean;
	isMonthlyPlan?: boolean;
	billingPeriod?: PricedAPIPlan[ 'bill_period' ] | null;
	currencyCode?: PricedAPIPlan[ 'currency_code' ] | null;

	// TODO clk define this...
	cartItemForPlan?: {
		product_slug: string;
	} | null;
};

// TODO clk: move to plans data store
export type PlansIntent =
	| 'plans-blog-onboarding'
	| 'plans-newsletter'
	| 'plans-link-in-bio'
	| 'plans-new-hosted-site'
	| 'plans-plugins'
	| 'plans-jetpack-app'
	| 'plans-import'
	| 'plans-woocommerce'
	| 'plans-default-wpcom'
	| 'default';

interface Props {
	// usePlanFeatures is intermediate until plan features are ported to @automattic/calypso-products and be queried from there
	usePlanFeatures: ( {
		planSlugs,
		intent,
		isGlobalStylesOnPersonal,
		selectedFeature,
	}: {
		planSlugs: PlanSlug[];
		intent?: PlansIntent;
		isGlobalStylesOnPersonal?: boolean;
		selectedFeature?: string;
	} ) => Record< PlanSlug, PlanFeatures >;
	// API plans will be ported to data store and be queried from there
	usePricedAPIPlans: ( {
		planSlugs,
	}: {
		planSlugs: PlanSlug[];
	} ) => Record< PlanSlug, PricedAPIPlan | null >;
	term?: ( typeof TERMS_LIST )[ number ]; // defaults to monthly
	intent?: PlansIntent;
	selectedPlan?: PlanSlug;
	sitePlanSlug?: PlanSlug | null;
	hideEnterprisePlan?: boolean;
	isInSignup?: boolean;
	// whether plan is upgradable from current plan (used in logged-in state)
	usePlanUpgradeabilityCheck?: ( { planSlugs }: { planSlugs: PlanSlug[] } ) => {
		[ key: string ]: boolean;
	};
	// for AB Test experiment:
	isGlobalStylesOnPersonal?: boolean;
}

const usePlanTypesWithIntent = ( {
	intent,
	selectedPlan,
	sitePlanSlug,
	hideEnterprisePlan,
}: Pick< Props, 'intent' | 'selectedPlan' | 'sitePlanSlug' | 'hideEnterprisePlan' > ): string[] => {
	const isEnterpriseAvailable = ! hideEnterprisePlan;
	const isBloggerAvailable =
		( selectedPlan && isBloggerPlan( selectedPlan ) ) ||
		( sitePlanSlug && isBloggerPlan( sitePlanSlug ) );

	let currentSitePlanType = null;
	if ( sitePlanSlug ) {
		currentSitePlanType = getPlan( sitePlanSlug )?.type;
	}

	const availablePlanTypes = [
		TYPE_FREE,
		...( isBloggerAvailable ? [ TYPE_BLOGGER ] : [] ),
		TYPE_PERSONAL,
		TYPE_PREMIUM,
		TYPE_BUSINESS,
		TYPE_ECOMMERCE,
		...( isEnterpriseAvailable ? [ TYPE_ENTERPRISE_GRID_WPCOM ] : [] ),
		TYPE_WOOEXPRESS_SMALL,
		TYPE_WOOEXPRESS_MEDIUM,
	];

	let planTypes;
	switch ( intent ) {
		case 'plans-woocommerce':
			planTypes = [ TYPE_WOOEXPRESS_SMALL, TYPE_WOOEXPRESS_MEDIUM ];
			break;
		case 'plans-blog-onboarding':
			planTypes = [ TYPE_FREE, TYPE_PERSONAL, TYPE_PREMIUM, TYPE_BUSINESS ];
			break;
		case 'plans-newsletter':
		case 'plans-link-in-bio':
			planTypes = [ TYPE_FREE, TYPE_PERSONAL, TYPE_PREMIUM ];
			break;
		case 'plans-new-hosted-site':
			planTypes = [ TYPE_FREE, TYPE_PERSONAL, TYPE_PREMIUM, TYPE_BUSINESS, TYPE_ECOMMERCE ];
			break;
		case 'plans-import':
			planTypes = [ TYPE_FREE, TYPE_PERSONAL, TYPE_PREMIUM, TYPE_BUSINESS ];
			break;
		case 'plans-plugins':
			planTypes = [
				...( currentSitePlanType ? [ currentSitePlanType ] : [] ),
				TYPE_BUSINESS,
				TYPE_ECOMMERCE,
			];
			break;
		case 'plans-jetpack-app':
			planTypes = [ TYPE_PERSONAL, TYPE_PREMIUM ];
			break;
		case 'plans-default-wpcom':
			planTypes = [
				TYPE_FREE,
				...( isBloggerAvailable ? [ TYPE_BLOGGER ] : [] ),
				TYPE_PERSONAL,
				TYPE_PREMIUM,
				TYPE_BUSINESS,
				TYPE_ECOMMERCE,
				...( isEnterpriseAvailable ? [ TYPE_ENTERPRISE_GRID_WPCOM ] : [] ),
			];
			break;
		default:
			planTypes = availablePlanTypes;
	}

	return planTypes;
};

// TODO clk: move to plans data store
const useGridPlansWithIntent = ( {
	usePlanFeatures,
	usePricedAPIPlans,
	term = TERM_MONTHLY,
	intent,
	selectedPlan,
	sitePlanSlug,
	hideEnterprisePlan,
	isInSignup,
	usePlanUpgradeabilityCheck,
	isGlobalStylesOnPersonal,
}: Props ): Record< PlanSlug, GridPlan > => {
	const availablePlanSlugs = usePlansFromTypes( {
		planTypes: usePlanTypesWithIntent( {
			intent: 'default',
			selectedPlan,
			sitePlanSlug,
			hideEnterprisePlan,
		} ),
		term,
	} );
	const planSlugsForIntent = usePlansFromTypes( {
		planTypes: usePlanTypesWithIntent( {
			intent,
			selectedPlan,
			sitePlanSlug,
			hideEnterprisePlan,
		} ),
		term,
	} );
	const planUpgradeability = usePlanUpgradeabilityCheck?.( { planSlugs: availablePlanSlugs } );
	// we only fetch highlights for the plans that are available for the intent
	const highlightLabels = useHighlightLabels( {
		intent,
		planSlugs: planSlugsForIntent,
		currentSitePlanSlug: sitePlanSlug,
		selectedPlan,
		planUpgradeability,
	} );

	// TODO: planFeatures to be queried from @automattic/calypso-products package
	const planFeatures = usePlanFeatures( {
		planSlugs: availablePlanSlugs,
		intent,
		isGlobalStylesOnPersonal,
	} );
	// TODO: pricedAPIPlans to be queried from data-store package
	const pricedAPIPlans = usePricedAPIPlans( { planSlugs: availablePlanSlugs } );

	return availablePlanSlugs.reduce( ( acc, planSlug ) => {
		const planConstantObj = applyTestFiltersToPlansList( planSlug, undefined );
		const planObject = pricedAPIPlans[ planSlug ];
		const isMonthlyPlan = isMonthly( planSlug );
		const availableForPurchase = !! ( isInSignup || planUpgradeability?.[ planSlug ] );

		let tagline = '';
		if ( 'plans-newsletter' === intent ) {
			tagline = planConstantObj.getNewsletterTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else if ( 'plans-link-in-bio' === intent ) {
			tagline = planConstantObj.getLinkInBioTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else if ( 'plans-blog-onboarding' === intent ) {
			tagline = planConstantObj.getBlogOnboardingTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else {
			tagline = planConstantObj.getPlanTagline?.( isGlobalStylesOnPersonal ) ?? '';
		}

		const product_name_short =
			isWpcomEnterpriseGridPlan( planSlug ) && planConstantObj.getPathSlug
				? planConstantObj.getPathSlug()
				: planObject?.product_name_short ?? null;
		const storageOptions =
			( planConstantObj.get2023PricingGridSignupStorageOptions &&
				planConstantObj.get2023PricingGridSignupStorageOptions() ) ||
			[];

		return {
			...acc,
			[ planSlug ]: {
				planSlug,
				// TODO clk: planName obviously needs to be refactored (removed) - use planSlug instead
				planName: planSlug,
				highlightLabel: highlightLabels[ planSlug ],
				isVisible: planSlugsForIntent.includes( planSlug ),
				features: planFeatures?.[ planSlug ]?.features || [],
				jpFeatures: planFeatures?.[ planSlug ]?.jpFeatures || [],
				storageOptions,
				tagline,
				product_name_short,
				availableForPurchase,
				current: sitePlanSlug === planSlug,
				isMonthlyPlan,
				planConstantObj,
				billingPeriod: planObject?.bill_period,
				currencyCode: planObject?.currency_code,
			},
		};
	}, {} as Record< PlanSlug, GridPlan > );
};

export default useGridPlansWithIntent;

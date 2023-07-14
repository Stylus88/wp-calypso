import {
	applyTestFiltersToPlansList,
	isMonthly,
	isWpcomEnterpriseGridPlan,
} from '@automattic/calypso-products';
import { useSelector } from 'react-redux';
import { getPlan } from 'calypso/state/plans/selectors/plan';
import { PlansIntent } from './use-wpcom-plans-with-intent';
import type { PlanSlug, FilteredPlan, FeatureObject } from '@automattic/calypso-products';
import type { PricedAPIPlan } from '@automattic/data-stores';

// move to plans-features-main
const useProductIds = ( { planSlugs }: { planSlugs: PlanSlug[] } ) => {
	return planSlugs.reduce( ( acc, planSlug ) => {
		const planConstantObj = applyTestFiltersToPlansList( planSlug, undefined );
		const planProductId = planConstantObj?.getProductId?.() ?? null;

		return {
			...acc,
			[ planSlug ]: planProductId,
		};
	}, {} as Record< PlanSlug, number | null > );
};

// move to plans-features-main
const usePricedAPIPlans = ( { planSlugs }: { planSlugs: PlanSlug[] } ) => {
	const productIds = useProductIds( { planSlugs } );
	return useSelector( ( state ) => {
		return planSlugs.reduce( ( acc, planSlug ) => {
			const productId = productIds[ planSlug ];
			return {
				...acc,
				[ planSlug ]: null !== productId ? getPlan( state, productId ) : null,
			};
		}, {} as Record< PlanSlug, PricedAPIPlan | null > );
	} );
};

interface Props {
	planSlugs: PlanSlug[];
	usePricedAPIPlans: ( {
		planSlugs,
	}: {
		planSlugs: PlanSlug[];
	} ) => Record< PlanSlug, PricedAPIPlan | null >;
	getPlanFeaturesObject: ( planFeaturesList?: string[] ) => FeatureObject[];
	currentSitePlanSlug?: PlanSlug | null;
	isInSignup?: boolean;
	intent?: PlansIntent | null;
	isGlobalStylesOnPersonal?: boolean;
	selectedFeature?: string | null;
	usePlanUpgradeabilityCheck?: ( { planSlugs }: { planSlugs: PlanSlug[] } ) => {
		[ planSlug in PlanSlug ]: boolean;
	};
}

type TransformedFeatureObject = FeatureObject & {
	availableForCurrentPlan: boolean;
	availableOnlyForAnnualPlans: boolean;
};

interface PlanFeatures {
	features: TransformedFeatureObject[];
	jpFeatures: TransformedFeatureObject[];
}

interface PlanProperties {
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
	cartItemForPlan?: {
		product_slug: string;
	} | null;
}

export type PlanProperties_ = {
	features: TransformedFeatureObject[];
	jpFeatures: TransformedFeatureObject[];
	isVisible: boolean;
};

const usePlanFeatures = ( {
	planSlugs,
	getPlanFeaturesObject,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
}: Pick<
	Props,
	'planSlugs' | 'getPlanFeaturesObject' | 'intent' | 'isGlobalStylesOnPersonal' | 'selectedFeature'
> ): Record< PlanSlug, PlanFeatures > => {
	return planSlugs.reduce( ( acc, planSlug ) => {
		const planConstantObj = applyTestFiltersToPlansList( planSlug, undefined );
		const isMonthlyPlan = isMonthly( planSlug );

		let planFeatures = [];
		let jetpackFeatures: FeatureObject[] = [];

		if ( 'plans-newsletter' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getNewsletterSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
		} else if ( 'plans-link-in-bio' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getLinkInBioSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
		} else if ( 'plans-blog-onboarding' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getBlogOnboardingSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				planConstantObj.getBlogOnboardingSignupJetpackFeatures?.() ?? []
			);
		} else {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.get2023PricingGridSignupWpcomFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				planConstantObj.get2023PricingGridSignupJetpackFeatures?.() ?? []
			);
		}

		const annualPlansOnlyFeatures = planConstantObj.getAnnualPlansOnlyFeatures?.() || [];

		const planFeaturesTransformed: TransformedFeatureObject[] = [];
		let jetpackFeaturesTransformed: TransformedFeatureObject[] = [];
		const topFeature = selectedFeature
			? planFeatures.find( ( feature ) => feature.getSlug() === selectedFeature )
			: undefined;

		if ( topFeature ) {
			const availableOnlyForAnnualPlans = annualPlansOnlyFeatures.includes( topFeature.getSlug() );
			planFeaturesTransformed.unshift( {
				...topFeature,
				availableOnlyForAnnualPlans,
				availableForCurrentPlan: ! isMonthlyPlan || ! availableOnlyForAnnualPlans,
			} );
		}

		if ( annualPlansOnlyFeatures.length > 0 ) {
			planFeatures.forEach( ( feature ) => {
				if ( feature === topFeature ) {
					return;
				}

				const availableOnlyForAnnualPlans = annualPlansOnlyFeatures.includes( feature.getSlug() );

				planFeaturesTransformed.push( {
					...feature,
					availableOnlyForAnnualPlans,
					availableForCurrentPlan: ! isMonthlyPlan || ! availableOnlyForAnnualPlans,
				} );
			} );
		}

		jetpackFeaturesTransformed = jetpackFeatures.map( ( feature ) => {
			const availableOnlyForAnnualPlans = annualPlansOnlyFeatures.includes( feature.getSlug() );

			return {
				...feature,
				availableOnlyForAnnualPlans,
				availableForCurrentPlan: ! isMonthlyPlan || ! availableOnlyForAnnualPlans,
			};
		} );

		return {
			...acc,
			features: planFeaturesTransformed,
			jpFeatures: jetpackFeaturesTransformed,
		};
	}, {} as Record< PlanSlug, PlanFeatures > );
};

const usePlanProperties = ( {
	planSlugs,
	usePricedAPIPlans,
	getPlanFeaturesObject,
	currentSitePlanSlug,
	isInSignup,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
	usePlanUpgradeabilityCheck,
}: Props ): Record< PlanSlug, PlanProperties > => {
	const pricedAPIPlans = usePricedAPIPlans( { planSlugs } );
	const planFeatures = usePlanFeatures( {
		planSlugs,
		getPlanFeaturesObject,
		intent,
		isGlobalStylesOnPersonal,
		selectedFeature,
	} );
	const planUpgradeability = usePlanUpgradeabilityCheck?.( { planSlugs } );

	return planSlugs.reduce( ( acc, planSlug ) => {
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
				storageOptions,
				features: planFeatures[ planSlug ].features,
				jpFeatures: planFeatures[ planSlug ].jpFeatures,
				tagline,
				product_name_short,
				availableForPurchase,
				current: currentSitePlanSlug === planSlug,
				isMonthlyPlan,
				planConstantObj,
				billingPeriod: planObject?.bill_period,
				currencyCode: planObject?.currency_code,
				planName: planSlug,
			},
		};
	}, {} as Record< PlanSlug, PlanProperties > );
};

export default usePlanProperties;

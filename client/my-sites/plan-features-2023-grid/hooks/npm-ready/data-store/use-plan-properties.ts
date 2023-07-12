import {
	applyTestFiltersToPlansList,
	isMonthly,
	isWpcomEnterpriseGridPlan,
} from '@automattic/calypso-products';
import { useSelector } from 'react-redux';
import { getPlanFeaturesObject, type FeatureObject } from 'calypso/lib/plans/features-list'; // TODO clk needs migration
import { getPlan } from 'calypso/state/plans/selectors/plan';
import { PlansIntent } from './use-wpcom-plans-with-intent';
import type { PlanSlug, FilteredPlan } from '@automattic/calypso-products';
import type { PricedAPIPlan } from '@automattic/data-stores';
import type { TranslateResult } from 'i18n-calypso';

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

interface PlanProperties {
	current?: boolean;
	isMonthlyPlan: boolean;
	planConstantObj: FilteredPlan;
	billingPeriod?: PricedAPIPlan[ 'bill_period' ] | null;
	currencyCode?: PricedAPIPlan[ 'currency_code' ] | null;
	cartItemForPlan: {
		product_slug: string;
	} | null;
}

export type PlanProperties_ = {
	features: TransformedFeatureObject[];
	jpFeatures: TransformedFeatureObject[];
	isVisible: boolean;
	planName: PlanSlug;
	product_name_short: string;
	tagline: string;
	storageOptions: string[];
	availableForPurchase: boolean;
};

const usePlanProperties = ( {
	planSlugs,
	usePricedAPIPlans,
	currentSitePlanSlug,
	isInSignup,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
	usePlanUpgradeabilityCheck,
}: Props ): Record< PlanSlug, PlanProperties > => {
	const pricedAPIPlans = usePricedAPIPlans( { planSlugs } );
	const planUpgradeability = usePlanUpgradeabilityCheck?.( { planSlugs } );

	return planSlugs.reduce( ( acc, planSlug ) => {
		const planConstantObj = applyTestFiltersToPlansList( planSlug, undefined );
		const planObject = pricedAPIPlans[ planSlug ];
		const isMonthlyPlan = isMonthly( planSlug );
		const availableForPurchase = !! ( isInSignup || planUpgradeability?.[ planSlug ] );

		let planFeatures = [];
		let jetpackFeatures: FeatureObject[] = [];
		let tagline = '';

		if ( 'plans-newsletter' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getNewsletterSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
			tagline = planConstantObj.getNewsletterTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else if ( 'plans-link-in-bio' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getLinkInBioSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
			tagline = planConstantObj.getLinkInBioTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else if ( 'plans-blog-onboarding' === intent ) {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.getBlogOnboardingSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				planConstantObj.getBlogOnboardingSignupJetpackFeatures?.() ?? []
			);
			tagline = planConstantObj.getBlogOnboardingTagLine?.( isGlobalStylesOnPersonal ) ?? '';
		} else {
			planFeatures = getPlanFeaturesObject(
				planConstantObj?.get2023PricingGridSignupWpcomFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				planConstantObj.get2023PricingGridSignupJetpackFeatures?.() ?? []
			);
			tagline = planConstantObj.getPlanTagline?.( isGlobalStylesOnPersonal ) ?? '';
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

		const product_name_short =
			isWpcomEnterpriseGridPlan( planSlug ) && planConstantObj.getPathSlug
				? planConstantObj.getPathSlug()
				: planObject?.product_name_short ?? '';
		const storageOptions =
			( planConstantObj.get2023PricingGridSignupStorageOptions &&
				planConstantObj.get2023PricingGridSignupStorageOptions() ) ||
			[];

		return {
			...acc,
			[ planSlug ]: {
				storageOptions,
				features: planFeaturesTransformed,
				jpFeatures: jetpackFeaturesTransformed,

				availableForPurchase,
				current: currentSitePlanSlug === planSlug,
				isMonthlyPlan,
				planConstantObj,
				billingPeriod: planObject?.bill_period,
				currencyCode: planObject?.currency_code,
			},
		};
	}, {} as Record< PlanSlug, PlanProperties > );
};

export default usePlanProperties;

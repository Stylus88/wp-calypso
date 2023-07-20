import {
	applyTestFiltersToPlansList,
	FeatureList,
	isMonthly,
	PlanSlug,
} from '@automattic/calypso-products';
import getPlanFeaturesObject from 'calypso/my-sites/plan-features-2023-grid/lib/get-plan-features-object';
import type { FeatureObject } from '@automattic/calypso-products';
import type {
	TransformedFeatureObject,
	PlanFeaturesForGridPlan,
	PlansIntent,
} from 'calypso/my-sites/plan-features-2023-grid/hooks/npm-ready/data-store/use-grid-plans';

export type UsePlanFeaturesForGridPlans = ( {
	planSlugs,
	// allFeaturesList temporary until feature definitions are ported to calypso-products package
	allFeaturesList,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
}: {
	planSlugs: PlanSlug[];
	allFeaturesList: FeatureList;
	intent?: PlansIntent;
	isGlobalStylesOnPersonal?: boolean;
	selectedFeature?: string | null;
} ) => { [ planSlug: string ]: PlanFeaturesForGridPlan };

/*
 * usePlanFeaturesForGridPlans:
 * - these plan features are only relevannt to FeaturesGrid and Spotlight components (ComparisonGrid computes these differently)
 * - plan features will be ported to a package and be queried from there
 * - this hook can migrate to data store once that happens
 */
const usePlanFeaturesForGridPlans: UsePlanFeaturesForGridPlans = ( {
	planSlugs,
	allFeaturesList,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
} ) => {
	return planSlugs.reduce( ( acc, planSlug ) => {
		const planConstantObj = applyTestFiltersToPlansList( planSlug, undefined );
		const isMonthlyPlan = isMonthly( planSlug );

		let planFeatures = [];
		let jetpackFeatures: FeatureObject[] = [];

		if ( 'plans-newsletter' === intent ) {
			planFeatures = getPlanFeaturesObject(
				allFeaturesList,
				planConstantObj?.getNewsletterSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
		} else if ( 'plans-link-in-bio' === intent ) {
			planFeatures = getPlanFeaturesObject(
				allFeaturesList,
				planConstantObj?.getLinkInBioSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);
		} else if ( 'plans-blog-onboarding' === intent ) {
			planFeatures = getPlanFeaturesObject(
				allFeaturesList,
				planConstantObj?.getBlogOnboardingSignupFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				allFeaturesList,
				planConstantObj.getBlogOnboardingSignupJetpackFeatures?.() ?? []
			);
		} else {
			planFeatures = getPlanFeaturesObject(
				allFeaturesList,
				planConstantObj?.get2023PricingGridSignupWpcomFeatures?.( isGlobalStylesOnPersonal ) ?? []
			);

			jetpackFeatures = getPlanFeaturesObject(
				allFeaturesList,
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
			[ planSlug ]: {
				features: planFeaturesTransformed,
				jpFeatures: jetpackFeaturesTransformed,
			},
		};
	}, {} as { [ planSlug: string ]: PlanFeaturesForGridPlan } );
};

export default usePlanFeaturesForGridPlans;

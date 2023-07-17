import { applyTestFiltersToPlansList, isMonthly } from '@automattic/calypso-products';
import { getPlanFeaturesObject } from 'calypso/lib/plans/features-list';
import type { PlanSlug, FeatureObject } from '@automattic/calypso-products';
import type {
	PlanFeatures,
	PlansIntent,
	TransformedFeatureObject,
} from 'calypso/my-sites/plan-features-2023-grid/hooks/npm-ready/data-store/use-grid-plans-with-intent';

type Props = {
	planSlugs: PlanSlug[];
	intent?: PlansIntent;
	isGlobalStylesOnPersonal?: boolean;
	selectedFeature?: string;
};

// plan features will be ported to a package and be queried from there
// this hook can migrate to data store once that happens
const usePlanFeatures = ( {
	planSlugs,
	intent,
	isGlobalStylesOnPersonal,
	selectedFeature,
}: Props ): Record< PlanSlug, PlanFeatures > => {
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

export default usePlanFeatures;

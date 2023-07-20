import {
	chooseDefaultCustomerType,
	getPlan,
	isFreePlan,
	isPersonalPlan,
	getPlanPath,
	PLAN_PERSONAL,
	PlanSlug,
} from '@automattic/calypso-products';
import { Button } from '@automattic/components';
import { WpcomPlansUI } from '@automattic/data-stores';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import classNames from 'classnames';
import { localize, useTranslate } from 'i18n-calypso';
import page from 'page';
import { useSelector } from 'react-redux';
import AsyncLoad from 'calypso/components/async-load';
import QueryPlans from 'calypso/components/data/query-plans';
import QuerySitePlans from 'calypso/components/data/query-site-plans';
import QuerySites from 'calypso/components/data/query-sites';
import FormattedHeader from 'calypso/components/formatted-header';
import { planItem as getCartItemForPlan } from 'calypso/lib/cart-values/cart-items';
import { isValidFeatureKey } from 'calypso/lib/plans/features-list';
import PlanNotice from 'calypso/my-sites/plans-features-main/components/plan-notice';
import PlanTypeSelector from 'calypso/my-sites/plans-features-main/components/plan-type-selector';
import canUpgradeToPlan from 'calypso/state/selectors/can-upgrade-to-plan';
import getDomainFromHomeUpsellInQuery from 'calypso/state/selectors/get-domain-from-home-upsell-in-query';
import getPreviousRoute from 'calypso/state/selectors/get-previous-route';
import isEligibleForWpComMonthlyPlan from 'calypso/state/selectors/is-eligible-for-wpcom-monthly-plan';
import { useSiteGlobalStylesStatus } from 'calypso/state/sites/hooks/use-site-global-styles-status';
import { getCurrentPlan } from 'calypso/state/sites/plans/selectors';
import { getSitePlanSlug, getSiteSlug } from 'calypso/state/sites/selectors';
import useGridPlans from '../plan-features-2023-grid/hooks/npm-ready/data-store/use-grid-plans';
import { FreePlanPaidDomainDialog } from './components/free-plan-paid-domain-dialog';
import usePlanFeaturesForGridPlans from './hooks/data-store/use-plan-features-for-grid-plans';
import usePricedAPIPlans from './hooks/data-store/use-priced-api-plans';
import usePricingMetaForGridPlans from './hooks/data-store/use-pricing-meta';
import useFilterPlansForPlanFeatures from './hooks/use-filter-plans-for-plan-features';
import usePlanBillingPeriod from './hooks/use-plan-billing-period';
import usePlanFromUpsells from './hooks/use-plan-from-upsells';
import usePlanIntentFromSiteMeta from './hooks/use-plan-intent-from-site-meta';
import usePlanUpgradeabilityCheck from './hooks/use-plan-upgradeability-check';
import type { IntervalType } from './types';
import type {
	GridPlan,
	PlansIntent,
} from '../plan-features-2023-grid/hooks/npm-ready/data-store/use-grid-plans';
import type { DomainSuggestion } from '@automattic/data-stores';
import type { MinimalRequestCartProduct } from '@automattic/shopping-cart';
import type { PlanFeatures2023GridProps } from 'calypso/my-sites/plan-features-2023-grid';
import type { PlanActionOverrides } from 'calypso/my-sites/plan-features-2023-grid/types';
import type { PlanTypeSelectorProps } from 'calypso/my-sites/plans-features-main/components/plan-type-selector';
import type { IAppState } from 'calypso/state/types';
import './style.scss';

export interface PlansFeaturesMainProps {
	siteId?: number | null;
	intent?: PlansIntent | null;
	isInSignup?: boolean;
	plansWithScroll?: boolean;
	customerType?: string;
	basePlansPath?: string;
	selectedPlan?: PlanSlug;
	selectedFeature?: string;
	onUpgradeClick?: ( cartItemForPlan?: MinimalRequestCartProduct | null ) => void;
	redirectToAddDomainFlow?: boolean;
	hidePlanTypeSelector?: boolean;
	paidDomainName?: string;
	flowName?: string | null;
	replacePaidDomainWithFreeDomain?: ( freeDomainSuggestion: DomainSuggestion ) => void;
	intervalType?: IntervalType;
	planTypeSelector?: 'customer' | 'interval';
	withDiscount?: string;
	discountEndDate?: Date;
	hidePlansFeatureComparison?: boolean;
	hideFreePlan?: boolean; // to be deprecated
	hidePersonalPlan?: boolean; // to be deprecated
	hidePremiumPlan?: boolean; // to be deprecated
	hideBusinessPlan?: boolean; // to be deprecated
	hideEcommercePlan?: boolean; // to be deprecated
	hideEnterprisePlan?: boolean; // to be deprecated
	isStepperUpgradeFlow?: boolean;
	isLaunchPage?: boolean | null;
	isReskinned?: boolean;
	isPlansInsideStepper?: boolean;
	showBiennialToggle?: boolean;
	hideUnavailableFeatures?: boolean; // used to hide features that are not available, instead of strike-through as explained in #76206
	showLegacyStorageFeature?: boolean;
}

type OnboardingPricingGrid2023Props = PlansFeaturesMainProps & {
	gridPlansForComparisonGrid: GridPlan[];
	gridPlansForFeaturesGrid: GridPlan[];
	planTypeSelectorProps?: PlanTypeSelectorProps;
	sitePlanSlug?: PlanSlug | null;
	siteSlug?: string | null;
	intent?: PlansIntent;
};

const SecondaryFormattedHeader = ( { siteSlug }: { siteSlug?: string | null } ) => {
	const translate = useTranslate();
	const headerText = translate( 'Upgrade your plan to access this feature and more' );
	const subHeaderText = (
		<Button className="plans-features-main__view-all-plans is-link" href={ `/plans/${ siteSlug }` }>
			{ translate( 'View all plans' ) }
		</Button>
	);

	return (
		<FormattedHeader
			headerText={ headerText }
			subHeaderText={ subHeaderText }
			compactOnMobile
			isSecondary
		/>
	);
};

const OnboardingPricingGrid2023 = ( props: OnboardingPricingGrid2023Props ) => {
	const {
		gridPlansForFeaturesGrid,
		gridPlansForComparisonGrid,
		paidDomainName,
		isInSignup,
		isLaunchPage,
		flowName,
		onUpgradeClick,
		selectedFeature,
		selectedPlan,
		siteId,
		plansWithScroll,
		isReskinned,
		intervalType,
		planTypeSelectorProps,
		hidePlansFeatureComparison,
		hideUnavailableFeatures,
		sitePlanSlug,
		siteSlug,
		intent,
		showLegacyStorageFeature,
	} = props;
	const translate = useTranslate();
	const { setShowDomainUpsellDialog } = useDispatch( WpcomPlansUI.store );
	const domainFromHomeUpsellFlow = useSelector( getDomainFromHomeUpsellInQuery );
	const showDomainUpsellDialog = useCallback( () => {
		setShowDomainUpsellDialog( true );
	}, [ setShowDomainUpsellDialog ] );
	const { globalStylesInPersonalPlan } = useSiteGlobalStylesStatus( siteId );

	let planActionOverrides: PlanActionOverrides | undefined;
	if ( sitePlanSlug && isFreePlan( sitePlanSlug ) ) {
		planActionOverrides = {
			loggedInFreePlan: domainFromHomeUpsellFlow
				? {
						callback: showDomainUpsellDialog,
						text: translate( 'Keep my plan', { context: 'verb' } ),
				  }
				: {
						callback: () => {
							page.redirect( `/add-ons/${ siteSlug }` );
						},
						text: translate( 'Manage add-ons', { context: 'verb' } ),
				  },
		};
	}

	const asyncProps: PlanFeatures2023GridProps = {
		paidDomainName,
		isInSignup,
		isLaunchPage,
		onUpgradeClick,
		flowName,
		selectedFeature,
		selectedPlan,
		siteId,
		isReskinned,
		intervalType,
		hidePlansFeatureComparison,
		hideUnavailableFeatures,
		currentSitePlanSlug: sitePlanSlug,
		planActionOverrides,
		intent,
		isGlobalStylesOnPersonal: globalStylesInPersonalPlan,
		gridPlansForFeaturesGrid,
		gridPlansForComparisonGrid,
		showLegacyStorageFeature,
		usePricingMetaForGridPlans,
	};

	const asyncPlanFeatures2023Grid = (
		<AsyncLoad
			require="calypso/my-sites/plan-features-2023-grid"
			{ ...asyncProps }
			planTypeSelectorProps={ planTypeSelectorProps }
		/>
	);

	return (
		<div
			className={ classNames( 'plans-features-main__group', 'is-wpcom', 'is-2023-pricing-grid', {
				'is-scrollable': plansWithScroll,
			} ) }
			data-e2e-plans="wpcom"
		>
			{ asyncPlanFeatures2023Grid }
		</div>
	);
};

const PlansFeaturesMain = ( {
	paidDomainName,
	flowName,
	replacePaidDomainWithFreeDomain,
	onUpgradeClick,
	hidePlanTypeSelector,
	redirectToAddDomainFlow,
	siteId,
	selectedPlan,
	basePlansPath,
	selectedFeature,
	plansWithScroll,
	withDiscount,
	discountEndDate,
	hideFreePlan,
	hidePersonalPlan,
	hidePremiumPlan,
	hideBusinessPlan,
	hideEcommercePlan,
	hideEnterprisePlan,
	intent: intentFromProps, // do not set a default value for this prop here
	isReskinned,
	showBiennialToggle,
	customerType = 'personal',
	planTypeSelector = 'interval',
	intervalType = 'yearly',
	hidePlansFeatureComparison = false,
	hideUnavailableFeatures = false,
	isInSignup = false,
	isPlansInsideStepper = false,
	isStepperUpgradeFlow = false,
	isLaunchPage = false,
	showLegacyStorageFeature = false,
}: PlansFeaturesMainProps ) => {
	const [ isFreePlanPaidDomainDialogOpen, setIsFreePlanPaidDomainDialogOpen ] = useState( false );
	const currentPlan = useSelector( ( state: IAppState ) => getCurrentPlan( state, siteId ) );
	const eligibleForWpcomMonthlyPlans = useSelector( ( state: IAppState ) =>
		isEligibleForWpComMonthlyPlan( state, siteId )
	);
	const siteSlug = useSelector( ( state: IAppState ) => getSiteSlug( state, siteId ) );
	const sitePlanSlug = useSelector( ( state: IAppState ) =>
		siteId ? getSitePlanSlug( state, siteId ) : null
	);
	const userCanUpgradeToPersonalPlan = useSelector(
		( state: IAppState ) => siteId && canUpgradeToPlan( state, siteId, PLAN_PERSONAL )
	);
	const previousRoute = useSelector( ( state: IAppState ) => getPreviousRoute( state ) );

	let _customerType = chooseDefaultCustomerType( {
		currentCustomerType: customerType,
		selectedPlan,
		currentPlan: { productSlug: currentPlan?.productSlug },
	} );
	// Make sure the plans for the default customer type can be purchased.
	if ( _customerType === 'personal' && userCanUpgradeToPersonalPlan ) {
		_customerType = 'business';
	}

	const isDisplayingPlansNeededForFeature = () => {
		if (
			selectedFeature &&
			isValidFeatureKey( selectedFeature ) &&
			selectedPlan &&
			getPlan( selectedPlan ) &&
			! isPersonalPlan( selectedPlan ) &&
			( 'interval' === planTypeSelector || ! previousRoute.startsWith( '/plans/' ) )
		) {
			return true;
		}

		return false;
	};

	const toggleIsFreePlanPaidDomainDialogOpen = () => {
		setIsFreePlanPaidDomainDialogOpen( ! isFreePlanPaidDomainDialogOpen );
	};

	const handleUpgradeClick = ( cartItemForPlan?: { product_slug: string } | null ) => {
		// `cartItemForPlan` is empty if Free plan is selected. Show `FreePlanPaidDomainDialog`
		// in that case and exit. `FreePlanPaidDomainDialog` takes over from there.
		// It only applies to main onboarding flow and the paid media flow at the moment.
		// Standardizing it or not is TBD; see Automattic/growth-foundations#63 and pdgrnI-2nV-p2#comment-4110 for relevant discussion.
		if (
			( 'onboarding' === flowName || 'onboarding-pm' === flowName ) &&
			paidDomainName &&
			! cartItemForPlan
		) {
			toggleIsFreePlanPaidDomainDialogOpen();
			return;
		}

		if ( onUpgradeClick ) {
			onUpgradeClick( cartItemForPlan );
			return;
		}

		const planPath = cartItemForPlan?.product_slug
			? getPlanPath( cartItemForPlan.product_slug )
			: '';
		const checkoutUrlWithArgs = `/checkout/${ siteSlug }/${ planPath }`;

		page( checkoutUrlWithArgs );
	};

	const term = usePlanBillingPeriod( {
		intervalType,
		...( selectedPlan ? { defaultValue: getPlan( selectedPlan )?.term } : {} ),
	} );

	// TODO: plans from upsell takes precedence for setting intent right now
	// - this is currently set to the default wpcom set until we have updated tailored features for all plans
	// - at which point, we'll inject the upsell plan to the tailored plans mix instead
	const intentFromSiteMeta = usePlanIntentFromSiteMeta();
	const planFromUpsells = usePlanFromUpsells();
	const intent = planFromUpsells
		? 'plans-default-wpcom'
		: intentFromProps || intentFromSiteMeta.intent || 'plans-default-wpcom';

	const gridPlans = useGridPlans( {
		intent,
		selectedPlan,
		sitePlanSlug,
		hideEnterprisePlan,
		term,
		selectedFeature,
		usePlanUpgradeabilityCheck,
		usePlanFeaturesForGridPlans,
		usePricedAPIPlans,
		usePricingMetaForGridPlans,
	} );

	// TODO: `useFilterPlansForPlanFeatures` should gradually deprecate and whatever remains to fall into the `useGridPlans` hook
	const filteredPlansForPlanFeatures =
		useFilterPlansForPlanFeatures( {
			plans: gridPlans,
			isDisplayingPlansNeededForFeature: isDisplayingPlansNeededForFeature(),
			selectedPlan,
			hideFreePlan,
			hidePersonalPlan,
			hidePremiumPlan,
			hideBusinessPlan,
			hideEcommercePlan,
		} ) || null;
	// we need all the available plans for comparison grid (these should extend into plans-ui data store selectors)
	const gridPlansForComparisonGrid = filteredPlansForPlanFeatures;
	// we neeed only the visible ones for features grid (these should extend into plans-ui data store selectors)
	const gridPlansForFeaturesGrid = filteredPlansForPlanFeatures.reduce( ( acc, gridPlan ) => {
		return [ ...acc, ...( gridPlan.isVisible ? [ gridPlan ] : [] ) ];
	}, [] as GridPlan[] );

	// If advertising plans for a certain feature, ensure user has pressed "View all plans" before they can see others
	let hidePlanSelector = 'customer' === planTypeSelector && isDisplayingPlansNeededForFeature();
	// In the "purchase a plan and free domain" flow we do not want to show
	// monthly plans because monthly plans do not come with a free domain.
	if ( redirectToAddDomainFlow !== undefined || hidePlanTypeSelector ) {
		hidePlanSelector = true;
	}

	const planTypeSelectorProps = {
		basePlansPath,
		isStepperUpgradeFlow,
		isInSignup,
		eligibleForWpcomMonthlyPlans,
		isPlansInsideStepper,
		intervalType,
		customerType: _customerType,
		siteSlug,
		selectedPlan,
		selectedFeature,
		showBiennialToggle,
		kind: planTypeSelector,
		plans: filteredPlansForPlanFeatures.map( ( gridPlan ) => gridPlan.planSlug ),
	};

	return (
		<div
			className={ classNames( 'plans-features-main', 'is-pricing-grid-2023-plans-features-main' ) }
		>
			<QueryPlans />
			<QuerySites siteId={ siteId } />
			<QuerySitePlans siteId={ siteId } />
			{ paidDomainName && isFreePlanPaidDomainDialogOpen && (
				<FreePlanPaidDomainDialog
					paidDomainName={ paidDomainName }
					suggestedPlanSlug={ PLAN_PERSONAL }
					onClose={ toggleIsFreePlanPaidDomainDialogOpen }
					onFreePlanSelected={ ( freeDomainSuggestion ) => {
						replacePaidDomainWithFreeDomain?.( freeDomainSuggestion );
						onUpgradeClick?.( null );
					} }
					onPlanSelected={ () => {
						const cartItemForPlan = getCartItemForPlan( PLAN_PERSONAL );
						onUpgradeClick?.( cartItemForPlan );
					} }
				/>
			) }
			{ siteId && (
				<PlanNotice
					visiblePlans={ Object.keys( filteredPlansForPlanFeatures ) as PlanSlug[] }
					siteId={ siteId }
					isInSignup={ isInSignup }
					{ ...( withDiscount &&
						discountEndDate && {
							discountInformation: {
								withDiscount,
								discountEndDate,
							},
						} ) }
				/>
			) }
			{ isDisplayingPlansNeededForFeature() && <SecondaryFormattedHeader siteSlug={ siteSlug } /> }
			{ ! intentFromSiteMeta.processing && (
				<>
					{ ! hidePlanSelector && <PlanTypeSelector { ...planTypeSelectorProps } /> }
					<OnboardingPricingGrid2023
						gridPlansForFeaturesGrid={ gridPlansForFeaturesGrid }
						gridPlansForComparisonGrid={ gridPlansForComparisonGrid }
						paidDomainName={ paidDomainName }
						isInSignup={ isInSignup }
						isLaunchPage={ isLaunchPage }
						flowName={ flowName }
						onUpgradeClick={ handleUpgradeClick }
						selectedFeature={ selectedFeature }
						selectedPlan={ selectedPlan }
						withDiscount={ withDiscount }
						discountEndDate={ discountEndDate }
						siteId={ siteId }
						plansWithScroll={ plansWithScroll }
						isReskinned={ isReskinned }
						intervalType={ intervalType }
						planTypeSelectorProps={ planTypeSelectorProps }
						hidePlansFeatureComparison={ hidePlansFeatureComparison }
						hideUnavailableFeatures={ hideUnavailableFeatures }
						sitePlanSlug={ sitePlanSlug }
						siteSlug={ siteSlug }
						intent={ intent }
						showLegacyStorageFeature={ showLegacyStorageFeature }
					/>
				</>
			) }
		</div>
	);
};

export default localize( PlansFeaturesMain );

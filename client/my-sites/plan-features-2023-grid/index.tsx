import {
	getPlanClass,
	isFreePlan,
	isPersonalPlan,
	isEcommercePlan,
	isWpComFreePlan,
	isWpcomEnterpriseGridPlan,
	isBusinessPlan,
	isPremiumPlan,
	isWooExpressMediumPlan,
	isWooExpressSmallPlan,
	isWooExpressPlan,
	PlanSlug,
	isWooExpressPlusPlan,
} from '@automattic/calypso-products';
import {
	JetpackLogo,
	BloombergLogo,
	CloudLogo,
	CNNLogo,
	CondenastLogo,
	DisneyLogo,
	FacebookLogo,
	SalesforceLogo,
	SlackLogo,
	TimeLogo,
	VIPLogo,
	WooLogo,
} from '@automattic/components';
import { isAnyHostingFlow } from '@automattic/onboarding';
import { MinimalRequestCartProduct } from '@automattic/shopping-cart';
import { Button } from '@wordpress/components';
import classNames from 'classnames';
import { localize, LocalizedComponent, LocalizeProps, useTranslate } from 'i18n-calypso';
import { Component, createRef } from 'react';
import { connect } from 'react-redux';
import QueryActivePromotions from 'calypso/components/data/query-active-promotions';
import FoldableCard from 'calypso/components/foldable-card';
import { retargetViewPlans } from 'calypso/lib/analytics/ad-tracking';
import scrollIntoViewport from 'calypso/lib/scroll-into-viewport';
import { useIsPlanUpgradeCreditVisible } from 'calypso/my-sites/plan-features-2023-grid/hooks/use-is-plan-upgrade-credit-visible';
import { PlanTypeSelectorProps } from 'calypso/my-sites/plans-features-main/components/plan-type-selector';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import getCurrentPlanPurchaseId from 'calypso/state/selectors/get-current-plan-purchase-id';
import { isCurrentUserCurrentPlanOwner } from 'calypso/state/sites/plans/selectors';
import { getSiteSlug, isCurrentPlanPaid } from 'calypso/state/sites/selectors';
import CalypsoShoppingCartProvider from '../checkout/calypso-shopping-cart-provider';
import { getManagePurchaseUrlFor } from '../purchases/paths';
import PlanFeatures2023GridActions from './components/actions';
import PlanFeatures2023GridBillingTimeframe from './components/billing-timeframe';
import PlanFeatures2023GridFeatures from './components/features';
import PlanFeatures2023GridHeaderPrice from './components/header-price';
import { PlanFeaturesItem } from './components/item';
import { PlanComparisonGrid } from './components/plan-comparison-grid';
import { Plans2023Tooltip } from './components/plans-2023-tooltip';
import PopularBadge from './components/popular-badge';
import PlansGridContextProvider, { usePlansGridContext } from './grid-context';
import useHighlightAdjacencyMatrix from './hooks/npm-ready/use-highlight-adjacency-matrix';
import useIsLargeCurrency from './hooks/use-is-large-currency';
import { getStorageStringFromFeature } from './util';
import type { PlansIntent } from './grid-context';
import type { GridPlan } from './hooks/npm-ready/data-store/use-grid-plans-with-intent';
import type { PlanActionOverrides } from './types';
import type { IAppState } from 'calypso/state/types';
import './style.scss';

type PlanRowOptions = {
	isMobile?: boolean;
	previousProductNameShort?: string | null;
};

const Container = (
	props: (
		| React.HTMLAttributes< HTMLDivElement >
		| React.HTMLAttributes< HTMLTableCellElement >
	 ) & { isMobile?: boolean; scope?: string }
) => {
	const { children, isMobile, ...otherProps } = props;
	return isMobile ? (
		<div { ...otherProps }>{ children }</div>
	) : (
		<td { ...otherProps }>{ children }</td>
	);
};

export type PlanFeatures2023GridProps = {
	planRecords: Record< PlanSlug, GridPlan >;
	planRecordsForComparisonGrid: Record< PlanSlug, GridPlan >;
	visiblePlans: PlanSlug[];
	isInSignup?: boolean;
	siteId?: number | null;
	isLaunchPage?: boolean | null;
	isReskinned?: boolean;
	onUpgradeClick?: ( cartItem?: MinimalRequestCartProduct | null ) => void;
	flowName?: string | null;
	paidDomainName?: string;
	intervalType?: string;
	currentSitePlanSlug?: string | null;
	hidePlansFeatureComparison?: boolean;
	hideUnavailableFeatures?: boolean; // used to hide features that are not available, instead of strike-through as explained in #76206
	planActionOverrides?: PlanActionOverrides;
	// Value of the `?plan=` query param, so we can highlight a given plan.
	selectedPlan?: string;
	// Value of the `?feature=` query param, so we can highlight a given feature and hide plans without it.
	selectedFeature?: string;
	intent?: PlansIntent;
	isGlobalStylesOnPersonal?: boolean;
	showLegacyStorageFeature?: boolean;
};

type PlanFeatures2023GridConnectedProps = {
	translate: LocalizeProps[ 'translate' ];
	recordTracksEvent: ( slug: string ) => void;
	canUserPurchasePlan: boolean | null;
	planTypeSelectorProps: PlanTypeSelectorProps;
	manageHref: string;
	selectedSiteSlug: string | null;
	isPlanUpgradeCreditEligible: boolean;
	isGlobalStylesOnPersonal?: boolean;
};

type PlanFeatures2023GridType = PlanFeatures2023GridProps &
	PlanFeatures2023GridConnectedProps & { children?: React.ReactNode } & {
		isLargeCurrency: boolean;
	};

type PlanFeatures2023GridState = {
	showPlansComparisonGrid: boolean;
};

const PlanLogo: React.FunctionComponent< {
	planIndex: number;
	planSlug: PlanSlug;
	isMobile?: boolean;
	isInSignup?: boolean;
} > = ( { planIndex, planSlug, isMobile, isInSignup } ) => {
	const { planRecords } = usePlansGridContext();
	const { current } = planRecords[ planSlug ];
	const translate = useTranslate();
	const highlightAdjacencyMatrix = useHighlightAdjacencyMatrix( {
		renderedPlans: Object.keys( planRecords ) as PlanSlug[],
	} );
	const headerClasses = classNames(
		'plan-features-2023-grid__header-logo',
		getPlanClass( planSlug )
	);
	const tableItemClasses = classNames( 'plan-features-2023-grid__table-item', {
		'popular-plan-parent-class': planRecords[ planSlug ]?.highlightLabel,
		'is-left-of-highlight': highlightAdjacencyMatrix[ planSlug ]?.leftOfHighlight,
		'is-right-of-highlight': highlightAdjacencyMatrix[ planSlug ]?.rightOfHighlight,
		'is-only-highlight': highlightAdjacencyMatrix[ planSlug ]?.isOnlyHighlight,
		'is-current-plan': current,
		'is-first-in-row': planIndex === 0,
		'is-last-in-row': planIndex === Object.keys( planRecords ).length - 1,
	} );
	const popularBadgeClasses = classNames( {
		'with-plan-logo': ! (
			isFreePlan( planSlug ) ||
			isPersonalPlan( planSlug ) ||
			isPremiumPlan( planSlug )
		),
		'is-current-plan': current,
	} );

	const shouldShowWooLogo = isEcommercePlan( planSlug ) && ! isWooExpressPlan( planSlug );

	return (
		<Container key={ planSlug } className={ tableItemClasses } isMobile={ isMobile }>
			<PopularBadge
				isInSignup={ isInSignup }
				planName={ planSlug }
				additionalClassName={ popularBadgeClasses }
			/>
			<header className={ headerClasses }>
				{ isBusinessPlan( planSlug ) && (
					<Plans2023Tooltip
						text={ translate(
							'WP Cloud gives you the tools you need to add scalable, highly available, extremely fast WordPress hosting.'
						) }
					>
						<CloudLogo />
					</Plans2023Tooltip>
				) }
				{ shouldShowWooLogo && (
					<Plans2023Tooltip
						text={ translate( 'Make your online store a reality with the power of WooCommerce.' ) }
					>
						<WooLogo />
					</Plans2023Tooltip>
				) }
				{ isWpcomEnterpriseGridPlan( planSlug ) && (
					<Plans2023Tooltip
						text={ translate( 'The trusted choice for enterprise WordPress hosting.' ) }
					>
						<VIPLogo />
					</Plans2023Tooltip>
				) }
			</header>
		</Container>
	);
};

export class PlanFeatures2023Grid extends Component<
	PlanFeatures2023GridType,
	PlanFeatures2023GridState
> {
	state = {
		showPlansComparisonGrid: false,
		planRecordsForTableSplit: this.props.planRecords,
	};

	plansComparisonGridContainerRef = createRef< HTMLDivElement >();

	componentDidMount() {
		// TODO clk: move these to PlansFeaturesMain (after Woo plans migrate)
		this.props.recordTracksEvent( 'calypso_wp_plans_test_view' );
		retargetViewPlans();
	}

	toggleShowPlansComparisonGrid = () => {
		this.setState( ( { showPlansComparisonGrid } ) => ( {
			showPlansComparisonGrid: ! showPlansComparisonGrid,
		} ) );
	};

	componentDidUpdate(
		prevProps: Readonly< PlanFeatures2023GridType >,
		prevState: Readonly< PlanFeatures2023GridState >
	) {
		// If the "Compare plans" button is clicked, scroll to the plans comparison grid.
		if (
			prevState.showPlansComparisonGrid === false &&
			this.plansComparisonGridContainerRef.current
		) {
			scrollIntoViewport( this.plansComparisonGridContainerRef.current, {
				behavior: 'smooth',
				scrollMode: 'if-needed',
			} );
		}
	}

	render() {
		const {
			isInSignup,
			planTypeSelectorProps,
			intervalType,
			isLaunchPage,
			flowName,
			currentSitePlanSlug,
			manageHref,
			canUserPurchasePlan,
			translate,
			selectedSiteSlug,
			hidePlansFeatureComparison,
			siteId,
			selectedPlan,
			selectedFeature,
			intent,
			isGlobalStylesOnPersonal,
			planRecords,
			planRecordsForComparisonGrid,
			showLegacyStorageFeature,
		} = this.props;
		return (
			<div className="plans-wrapper">
				<QueryActivePromotions />
				<div className="plan-features">
					<PlansGridContextProvider intent={ intent } planRecords={ planRecords }>
						<div className="plan-features-2023-grid__content">
							<div>
								<div className="plan-features-2023-grid__desktop-view">
									{ this.renderTable( Object.values( planRecords ) ) }
								</div>
								<div className="plan-features-2023-grid__tablet-view">
									{ this.renderTabletView() }
								</div>
								<div className="plan-features-2023-grid__mobile-view">
									{ this.renderMobileView() }
								</div>
							</div>
						</div>
					</PlansGridContextProvider>
				</div>
				{ ! hidePlansFeatureComparison && (
					<div className="plan-features-2023-grid__toggle-plan-comparison-button-container">
						<Button onClick={ this.toggleShowPlansComparisonGrid }>
							{ this.state.showPlansComparisonGrid
								? translate( 'Hide comparison' )
								: translate( 'Compare plans' ) }
						</Button>
					</div>
				) }
				{ ! hidePlansFeatureComparison && this.state.showPlansComparisonGrid ? (
					<div
						ref={ this.plansComparisonGridContainerRef }
						className="plan-features-2023-grid__plan-comparison-grid-container"
					>
						<PlansGridContextProvider
							intent={ intent }
							planRecords={ planRecordsForComparisonGrid }
						>
							<PlanComparisonGrid
								planTypeSelectorProps={ planTypeSelectorProps }
								planRecords={ planRecordsForComparisonGrid }
								intervalType={ intervalType }
								isInSignup={ isInSignup }
								isLaunchPage={ isLaunchPage }
								flowName={ flowName }
								currentSitePlanSlug={ currentSitePlanSlug }
								manageHref={ manageHref }
								canUserPurchasePlan={ canUserPurchasePlan }
								selectedSiteSlug={ selectedSiteSlug }
								onUpgradeClick={ this.handleUpgradeClick }
								siteId={ siteId }
								selectedPlan={ selectedPlan }
								selectedFeature={ selectedFeature }
								isGlobalStylesOnPersonal={ isGlobalStylesOnPersonal }
								showLegacyStorageFeature={ showLegacyStorageFeature }
							/>
							<div className="plan-features-2023-grid__toggle-plan-comparison-button-container">
								<Button onClick={ this.toggleShowPlansComparisonGrid }>
									{ translate( 'Hide comparison' ) }
								</Button>
							</div>
						</PlansGridContextProvider>
					</div>
				) : null }
			</div>
		);
	}

	renderTable( gridPlans: GridPlan[] ) {
		const { translate } = this.props;
		const tableClasses = classNames(
			'plan-features-2023-grid__table',
			`has-${ gridPlans.length }-cols`
		);

		return (
			<table className={ tableClasses }>
				<caption className="plan-features-2023-grid__screen-reader-text screen-reader-text">
					{ translate( 'Available plans to choose from' ) }
				</caption>
				<tbody>
					<tr>{ this.renderPlanLogos( gridPlans ) }</tr>
					<tr>{ this.renderPlanHeaders( gridPlans ) }</tr>
					<tr>{ this.renderPlanTagline( gridPlans ) }</tr>
					<tr>{ this.renderPlanPrice( gridPlans ) }</tr>
					<tr>{ this.renderBillingTimeframe( gridPlans ) }</tr>
					<tr>{ this.renderTopButtons( gridPlans ) }</tr>
					<tr>{ this.maybeRenderRefundNotice( gridPlans ) }</tr>
					<tr>{ this.renderPreviousFeaturesIncludedTitle( gridPlans ) }</tr>
					<tr>{ this.renderPlanFeaturesList( gridPlans ) }</tr>
					<tr>{ this.renderPlanStorageOptions( gridPlans ) }</tr>
				</tbody>
			</table>
		);
	}

	renderTabletView() {
		const { planRecords } = this.props;
		const planRecordItems = Object.values( planRecords );

		const numberOfPlansToShowOnTop = 4 === planRecordItems.length ? 2 : 3;
		const topRowPlans = planRecordItems.slice( 0, numberOfPlansToShowOnTop );
		const bottomRowPlans = planRecordItems.slice(
			numberOfPlansToShowOnTop,
			planRecordItems.length
		);
		const plansForTopRow = planRecordItems.filter( ( gridPlan ) =>
			topRowPlans.includes( gridPlan )
		);
		const plansForBottomRow = planRecordItems.filter( ( gridPlan ) =>
			bottomRowPlans.includes( gridPlan )
		);

		return (
			<>
				<div className="plan-features-2023-grid__table-top">
					{ this.renderTable( plansForTopRow ) }
				</div>
				{ plansForBottomRow.length > 0 && (
					<div className="plan-features-2023-grid__table-bottom">
						{ this.renderTable( plansForBottomRow ) }
					</div>
				) }
			</>
		);
	}

	renderMobileView() {
		const { translate, selectedFeature, planRecords } = this.props;
		const CardContainer = (
			props: React.ComponentProps< typeof FoldableCard > & { planName: string }
		) => {
			const { children, planName, ...otherProps } = props;
			return isWpcomEnterpriseGridPlan( planName ) ? (
				<div { ...otherProps }>{ children }</div>
			) : (
				<FoldableCard { ...otherProps } compact clickableHeader>
					{ children }
				</FoldableCard>
			);
		};
		let previousProductNameShort: string | null | undefined;

		return Object.values( planRecords ).map( ( gridPlan, index ) => {
			const planCardClasses = classNames(
				'plan-features-2023-grid__mobile-plan-card',
				getPlanClass( gridPlan.planSlug )
			);
			const planCardJsx = (
				<div className={ planCardClasses } key={ `${ gridPlan.planSlug }-${ index }` }>
					{ this.renderPlanLogos( [ gridPlan ], { isMobile: true } ) }
					{ this.renderPlanHeaders( [ gridPlan ], { isMobile: true } ) }
					{ this.renderPlanTagline( [ gridPlan ], { isMobile: true } ) }
					{ this.renderPlanPrice( [ gridPlan ], { isMobile: true } ) }
					{ this.renderBillingTimeframe( [ gridPlan ], { isMobile: true } ) }
					{ this.renderMobileFreeDomain( gridPlan.planSlug, gridPlan.isMonthlyPlan ) }
					{ this.renderTopButtons( [ gridPlan ], { isMobile: true } ) }
					{ this.maybeRenderRefundNotice( [ gridPlan ], { isMobile: true } ) }
					<CardContainer
						header={ translate( 'Show all features' ) }
						planName={ gridPlan.planSlug }
						key={ `${ gridPlan.planSlug }-${ index }` }
						expanded={
							selectedFeature &&
							gridPlan.features.some( ( feature ) => feature.getSlug() === selectedFeature )
						}
					>
						{ this.renderPreviousFeaturesIncludedTitle( [ gridPlan ], {
							isMobile: true,
							previousProductNameShort,
						} ) }
						{ this.renderPlanFeaturesList( [ gridPlan ], { isMobile: true } ) }
						{ this.renderPlanStorageOptions( [ gridPlan ], { isMobile: true } ) }
					</CardContainer>
				</div>
			);
			previousProductNameShort = gridPlan.product_name_short;
			return planCardJsx;
		} );
	}

	renderMobileFreeDomain( planSlug: PlanSlug, isMonthlyPlan?: boolean ) {
		const { translate } = this.props;

		if ( isMonthlyPlan || isWpComFreePlan( planSlug ) || isWpcomEnterpriseGridPlan( planSlug ) ) {
			return null;
		}
		const { paidDomainName } = this.props;

		const displayText = paidDomainName
			? translate( '%(paidDomainName)s is included', {
					args: { paidDomainName },
			  } )
			: translate( 'Free domain for one year' );

		return (
			<div className="plan-features-2023-grid__highlighted-feature">
				<PlanFeaturesItem>
					<span className="plan-features-2023-grid__item-info is-annual-plan-feature is-available">
						<span className="plan-features-2023-grid__item-title is-bold">{ displayText }</span>
					</span>
				</PlanFeaturesItem>
			</div>
		);
	}

	renderPlanPrice( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const {
			isReskinned,
			isLargeCurrency,
			translate,
			isPlanUpgradeCreditEligible,
			currentSitePlanSlug,
			siteId,
		} = this.props;
		return gridPlans.map( ( { planSlug } ) => {
			const isWooExpressPlus = isWooExpressPlusPlan( planSlug );
			const classes = classNames( 'plan-features-2023-grid__table-item', 'is-bottom-aligned', {
				'has-border-top': ! isReskinned,
			} );

			return (
				<Container
					scope="col"
					key={ planSlug }
					className={ classes }
					isMobile={ options?.isMobile }
				>
					<PlanFeatures2023GridHeaderPrice
						planSlug={ planSlug }
						isPlanUpgradeCreditEligible={ isPlanUpgradeCreditEligible }
						isLargeCurrency={ isLargeCurrency }
						currentSitePlanSlug={ currentSitePlanSlug }
						siteId={ siteId }
					/>
					{ isWooExpressPlus && (
						<div className="plan-features-2023-grid__header-tagline">
							{ translate( 'Speak to our team for a custom quote.' ) }
						</div>
					) }
				</Container>
			);
		} );
	}

	renderBillingTimeframe( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const { currentSitePlanSlug, siteId } = this.props;

		return gridPlans.map( ( { planConstantObj, planSlug, isMonthlyPlan, billingPeriod } ) => {
			const classes = classNames(
				'plan-features-2023-grid__table-item',
				'plan-features-2023-grid__header-billing-info'
			);

			return (
				<Container className={ classes } isMobile={ options?.isMobile } key={ planSlug }>
					<PlanFeatures2023GridBillingTimeframe
						isMonthlyPlan={ isMonthlyPlan }
						planSlug={ planSlug }
						billingTimeframe={ planConstantObj.getBillingTimeFrame() }
						billingPeriod={ billingPeriod }
						currentSitePlanSlug={ currentSitePlanSlug }
						siteId={ siteId }
					/>
				</Container>
			);
		} );
	}

	renderPlanLogos( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const { isInSignup } = this.props;

		return gridPlans.map( ( { planSlug }, index ) => {
			return (
				<PlanLogo
					key={ planSlug }
					planIndex={ index }
					planSlug={ planSlug }
					isMobile={ options?.isMobile }
					isInSignup={ isInSignup }
				/>
			);
		} );
	}

	renderPlanHeaders( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		return gridPlans.map( ( { planSlug, planConstantObj } ) => {
			const headerClasses = classNames(
				'plan-features-2023-grid__header',
				getPlanClass( planSlug )
			);

			return (
				<Container
					key={ planSlug }
					className="plan-features-2023-grid__table-item"
					isMobile={ options?.isMobile }
				>
					<header className={ headerClasses }>
						<h4 className="plan-features-2023-grid__header-title">
							{ planConstantObj.getTitle() }
						</h4>
					</header>
				</Container>
			);
		} );
	}

	renderPlanTagline( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		return gridPlans.map( ( { planSlug, tagline } ) => {
			return (
				<Container
					key={ planSlug }
					className="plan-features-2023-grid__table-item"
					isMobile={ options?.isMobile }
				>
					<div className="plan-features-2023-grid__header-tagline">{ tagline }</div>
				</Container>
			);
		} );
	}

	handleUpgradeClick = ( planSlug: PlanSlug ) => {
		const { onUpgradeClick: ownPropsOnUpgradeClick, planRecords } = this.props;
		const { cartItemForPlan } = planRecords[ planSlug ];

		// TODO clk: Revisit. Could this suffice: `ownPropsOnUpgradeClick?.( cartItemForPlan )`

		if ( cartItemForPlan ) {
			ownPropsOnUpgradeClick?.( cartItemForPlan );
			return;
		}

		if ( isFreePlan( planSlug ) ) {
			ownPropsOnUpgradeClick?.( null );
			return;
		}
	};

	renderTopButtons( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const {
			isInSignup,
			isLaunchPage,
			flowName,
			canUserPurchasePlan,
			manageHref,
			currentSitePlanSlug,
			selectedSiteSlug,
			translate,
			planActionOverrides,
		} = this.props;

		return gridPlans.map( ( { planSlug, planConstantObj, current, availableForPurchase } ) => {
			const classes = classNames(
				'plan-features-2023-grid__table-item',
				'is-top-buttons',
				'is-bottom-aligned'
			);

			// Leaving it `undefined` makes it use the default label
			let buttonText;

			if (
				isWooExpressMediumPlan( planSlug ) &&
				! isWooExpressMediumPlan( currentSitePlanSlug || '' )
			) {
				buttonText = translate( 'Get Performance', { textOnly: true } );
			} else if (
				isWooExpressSmallPlan( planSlug ) &&
				! isWooExpressSmallPlan( currentSitePlanSlug || '' )
			) {
				buttonText = translate( 'Get Essential', { textOnly: true } );
			}

			return (
				<Container key={ planSlug } className={ classes } isMobile={ options?.isMobile }>
					<PlanFeatures2023GridActions
						manageHref={ manageHref }
						canUserPurchasePlan={ canUserPurchasePlan }
						availableForPurchase={ availableForPurchase }
						className={ getPlanClass( planSlug ) }
						freePlan={ isFreePlan( planSlug ) }
						isWpcomEnterpriseGridPlan={ isWpcomEnterpriseGridPlan( planSlug ) }
						isWooExpressPlusPlan={ isWooExpressPlusPlan( planSlug ) }
						isInSignup={ isInSignup }
						isLaunchPage={ isLaunchPage }
						onUpgradeClick={ () => this.handleUpgradeClick( planSlug ) }
						planTitle={ planConstantObj.getTitle() }
						planSlug={ planSlug }
						flowName={ flowName }
						current={ current ?? false }
						currentSitePlanSlug={ currentSitePlanSlug }
						selectedSiteSlug={ selectedSiteSlug }
						buttonText={ buttonText }
						planActionOverrides={ planActionOverrides }
					/>
				</Container>
			);
		} );
	}

	maybeRenderRefundNotice( gridPlan: GridPlan[], options?: PlanRowOptions ) {
		const { translate, flowName } = this.props;

		if ( ! isAnyHostingFlow( flowName ) ) {
			return false;
		}

		return gridPlan.map( ( { planSlug, billingPeriod } ) => (
			<Container
				key={ planSlug }
				className="plan-features-2023-grid__table-item"
				isMobile={ options?.isMobile }
			>
				{ ! isFreePlan( planSlug ) && (
					<div className={ `plan-features-2023-grid__refund-notice ${ getPlanClass( planSlug ) }` }>
						{ translate( 'Refundable within %(dayCount)s days. No questions asked.', {
							args: {
								dayCount: billingPeriod === 365 ? 14 : 7,
							},
						} ) }
					</div>
				) }
			</Container>
		) );
	}

	renderEnterpriseClientLogos() {
		return (
			<div className="plan-features-2023-grid__item plan-features-2023-grid__enterprise-logo">
				<TimeLogo />
				<SlackLogo />
				<DisneyLogo />
				<CNNLogo />
				<SalesforceLogo />
				<FacebookLogo />
				<CondenastLogo />
				<BloombergLogo />
			</div>
		);
	}

	renderPreviousFeaturesIncludedTitle( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const { translate } = this.props;
		let previousPlanShortNameFromProperties: string | null = null;

		return gridPlans.map( ( { planSlug, product_name_short } ) => {
			const shouldRenderEnterpriseLogos =
				isWpcomEnterpriseGridPlan( planSlug ) || isWooExpressPlusPlan( planSlug );
			const shouldShowFeatureTitle = ! isWpComFreePlan( planSlug ) && ! shouldRenderEnterpriseLogos;
			const planShortName =
				options?.previousProductNameShort || previousPlanShortNameFromProperties;
			previousPlanShortNameFromProperties = product_name_short ?? null;
			const title =
				planShortName &&
				translate( 'Everything in %(planShortName)s, plus:', {
					args: { planShortName },
				} );
			const classes = classNames(
				'plan-features-2023-grid__common-title',
				getPlanClass( planSlug )
			);
			const rowspanProp =
				! options?.isMobile && shouldRenderEnterpriseLogos ? { rowSpan: '2' } : {};
			return (
				<Container
					key={ planSlug }
					isMobile={ options?.isMobile }
					className="plan-features-2023-grid__table-item"
					{ ...rowspanProp }
				>
					{ shouldShowFeatureTitle && <div className={ classes }>{ title }</div> }
					{ shouldRenderEnterpriseLogos && this.renderEnterpriseClientLogos() }
				</Container>
			);
		} );
	}

	renderPlanFeaturesList( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const { paidDomainName, translate, hideUnavailableFeatures, selectedFeature } = this.props;
		const plansWithFeatures = gridPlans.filter(
			( gridPlan ) =>
				! isWpcomEnterpriseGridPlan( gridPlan.planSlug ) &&
				! isWooExpressPlusPlan( gridPlan.planSlug )
		);

		return plansWithFeatures.map( ( { planSlug, features, jpFeatures }, mapIndex ) => {
			return (
				<Container
					key={ `${ planSlug }-${ mapIndex }` }
					isMobile={ options?.isMobile }
					className="plan-features-2023-grid__table-item"
				>
					<PlanFeatures2023GridFeatures
						features={ features }
						planName={ planSlug }
						paidDomainName={ paidDomainName }
						hideUnavailableFeatures={ hideUnavailableFeatures }
						selectedFeature={ selectedFeature }
					/>
					{ jpFeatures.length !== 0 && (
						<div className="plan-features-2023-grid__jp-logo" key="jp-logo">
							<Plans2023Tooltip
								text={ translate(
									'Security, performance and growth tools made by the WordPress experts.'
								) }
							>
								<JetpackLogo size={ 16 } />
							</Plans2023Tooltip>
						</div>
					) }
					<PlanFeatures2023GridFeatures
						features={ jpFeatures }
						planName={ planSlug }
						paidDomainName={ paidDomainName }
						hideUnavailableFeatures={ hideUnavailableFeatures }
					/>
				</Container>
			);
		} );
	}

	renderPlanStorageOptions( gridPlans: GridPlan[], options?: PlanRowOptions ) {
		const { translate } = this.props;

		return gridPlans.map( ( { planSlug, storageOptions } ) => {
			const storageJSX = storageOptions.map( ( storageFeature: string ) => {
				if ( storageFeature.length <= 0 ) {
					return;
				}
				return (
					<div className="plan-features-2023-grid__storage-buttons" key={ planSlug }>
						{ getStorageStringFromFeature( storageFeature ) }
					</div>
				);
			} );

			if ( options?.isMobile && isWpcomEnterpriseGridPlan( planSlug ) ) {
				return null;
			}

			return (
				<Container
					key={ planSlug }
					className="plan-features-2023-grid__table-item plan-features-2023-grid__storage"
					isMobile={ options?.isMobile }
				>
					{ storageOptions.length ? (
						<div className="plan-features-2023-grid__storage-title">{ translate( 'Storage' ) }</div>
					) : null }
					{ storageJSX }
				</Container>
			);
		} );
	}
}

const withIsLargeCurrency = ( Component: LocalizedComponent< typeof PlanFeatures2023Grid > ) => {
	return function ( props: PlanFeatures2023GridType ) {
		const isLargeCurrency = useIsLargeCurrency( {
			planSlugs: Object.keys( props.planRecords ) as PlanSlug[],
			siteId: props.siteId,
		} );
		return <Component { ...props } isLargeCurrency={ isLargeCurrency } />;
	};
};

/* eslint-disable wpcalypso/redux-no-bound-selectors */
const ConnectedPlanFeatures2023Grid = connect(
	( state: IAppState, ownProps: PlanFeatures2023GridType ) => {
		const { siteId, currentSitePlanSlug } = ownProps;
		// TODO clk: canUserManagePlan should be passed through props instead of being calculated here
		const canUserPurchasePlan = siteId
			? ! isCurrentPlanPaid( state, siteId ) || isCurrentUserCurrentPlanOwner( state, siteId )
			: null;
		const purchaseId = siteId && getCurrentPlanPurchaseId( state, siteId );
		// TODO clk: selectedSiteSlug has no other use than computing manageRef below. stop propagating it through props
		const selectedSiteSlug = getSiteSlug( state, siteId );

		const manageHref =
			purchaseId && selectedSiteSlug
				? getManagePurchaseUrlFor( selectedSiteSlug, purchaseId )
				: `/plans/my-plan/${ siteId }`;

		return {
			currentSitePlanSlug,
			canUserPurchasePlan,
			manageHref,
			selectedSiteSlug,
		};
	},
	{
		recordTracksEvent,
	}
)( withIsLargeCurrency( localize( PlanFeatures2023Grid ) ) );
/* eslint-enable wpcalypso/redux-no-bound-selectors */

const WrappedPlanFeatures2023Grid = ( props: PlanFeatures2023GridType ) => {
	const isPlanUpgradeCreditEligible = useIsPlanUpgradeCreditVisible(
		props.siteId,
		props.visiblePlans
	);

	if ( props.isInSignup ) {
		return (
			<ConnectedPlanFeatures2023Grid
				{ ...props }
				isPlanUpgradeCreditEligible={ isPlanUpgradeCreditEligible }
			/>
		);
	}

	return (
		<CalypsoShoppingCartProvider>
			<ConnectedPlanFeatures2023Grid
				{ ...props }
				isPlanUpgradeCreditEligible={ isPlanUpgradeCreditEligible }
			/>
		</CalypsoShoppingCartProvider>
	);
};

export default WrappedPlanFeatures2023Grid;

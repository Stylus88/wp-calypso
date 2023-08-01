import {
	isEcommercePlan,
	isBusinessPlan,
	isWooExpressPlan,
	isWpcomEnterpriseGridPlan,
} from '@automattic/calypso-products';
import { CloudLogo, VIPLogo, WooLogo } from '@automattic/components';
import classNames from 'classnames';
import { useTranslate } from 'i18n-calypso';
import { useState } from 'react';
import { PlanSlug } from 'calypso/types';
import { Plans2023Tooltip } from '../components/plans-2023-tooltip';
import PopularBadge from '../components/popular-badge';
import { usePlansGridContext } from '../grid-context';
import useHighlightAdjacencyMatrix from '../hooks/npm-ready/use-highlight-adjacency-matrix';
import { PlanProperties } from '../types';

const PlanLogo: React.FunctionComponent< {
	popularBadgeClasses: string;
	headerClasses: string;
	isInSignup?: boolean;
	renderedPlans: PlanSlug[];
	isTableCell?: boolean;
	planIndex: number;
	planProperties: PlanProperties;
	Container: HTMLDivElement | HTMLTableElement;
} > = ( {
	planProperties,
	isInSignup,
	popularBadgeClasses,
	headerClasses,
	renderedPlans,
	isTableCell,
	Container,
	planIndex,
} ) => {
	const [ activeTooltipId, setActiveTooltipId ] = useState( '' );
	const { planName, current } = planProperties;
	const translate = useTranslate();
	const shouldShowWooLogo = isEcommercePlan( planName ) && ! isWooExpressPlan( planName );
	const { planRecords } = usePlansGridContext();
	const highlightAdjacencyMatrix = useHighlightAdjacencyMatrix( { renderedPlans } );

	const tableItemClasses = classNames( 'plan-features-2023-grid__table-item', {
		'popular-plan-parent-class': planRecords[ planName ]?.highlightLabel,
		'is-left-of-highlight': highlightAdjacencyMatrix[ planName ]?.leftOfHighlight,
		'is-right-of-highlight': highlightAdjacencyMatrix[ planName ]?.rightOfHighlight,
		'is-only-highlight': highlightAdjacencyMatrix[ planName ]?.isOnlyHighlight,
		'is-current-plan': current,
		'is-first-in-row': planIndex === 0,
		'is-last-in-row': planIndex === renderedPlans.length - 1,
	} );

	return (
		<Container key={ planName } className={ tableItemClasses } isTableCell={ isTableCell }>
			<PopularBadge
				isInSignup={ isInSignup }
				planName={ planName }
				additionalClassName={ popularBadgeClasses }
			/>
			<header className={ headerClasses }>
				{ isBusinessPlan( planName ) && (
					<Plans2023Tooltip
						text={ translate(
							'WP Cloud gives you the tools you need to add scalable, highly available, extremely fast WordPress hosting.'
						) }
						id="wp-cloud-logo"
						setActiveTooltipId={ setActiveTooltipId }
						activeTooltipId={ activeTooltipId }
					>
						<CloudLogo />
					</Plans2023Tooltip>
				) }
				{ shouldShowWooLogo && (
					<Plans2023Tooltip
						text={ translate( 'Make your online store a reality with the power of WooCommerce.' ) }
						id="woo-logo"
						setActiveTooltipId={ setActiveTooltipId }
						activeTooltipId={ activeTooltipId }
					>
						<WooLogo />
					</Plans2023Tooltip>
				) }
				{ isWpcomEnterpriseGridPlan( planName ) && (
					<Plans2023Tooltip
						text={ translate( 'The trusted choice for enterprise WordPress hosting.' ) }
						id="enterprise-logo"
						setActiveTooltipId={ setActiveTooltipId }
						activeTooltipId={ activeTooltipId }
					>
						<VIPLogo />
					</Plans2023Tooltip>
				) }
			</header>
		</Container>
	);
};

export default PlanLogo;

import { Button } from '@automattic/components';
import formatCurrency from '@automattic/format-currency';
import classNames from 'classnames';
import { useTranslate } from 'i18n-calypso';
import { useContext } from 'react';
import DashboardDataContext from '../../sites-overview/dashboard-data-context';

import './style.scss';

export default function UpgradeLink( { isInline = false } ) {
	const translate = useTranslate();

	const { products } = useContext( DashboardDataContext );

	const monthlyProduct = products.find(
		( product ) => product.slug === 'jetpack-monitor' && product.price_interval === 'month'
	);

	const price = monthlyProduct && formatCurrency( monthlyProduct.amount, monthlyProduct.currency );

	const handleOnClick = () => {
		// TODO: Add event tracking here
		// TODO: Add redirect to upgrade link here
		// Do not use href for redirect since it is being used inside an "a" tag
		// and we cannot nest "a" tags
	};

	return (
		<Button
			className={ classNames( 'upgrade-link', { 'is-inline': isInline } ) }
			borderless
			compact
			onClick={ handleOnClick }
		>
			<span>
				{ price
					? translate( 'Upgrade (%(price)s/m)', {
							args: { price },
							comment: '%price is the price of the upgrade, e.g. $5/m where m is "month"',
					  } )
					: translate( 'Upgrade' ) }
			</span>
		</Button>
	);
}

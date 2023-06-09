import { useTranslate } from 'i18n-calypso';
import FormCheckbox from 'calypso/components/forms/form-checkbox';
import { Subscriber } from '../types';
import { SubscriberRow } from './subscriber-row';
import './styles.scss';

type SubscriberListProps = {
	subscribers: Subscriber[];
	locale: string;
};

export const SubscriberList = ( { subscribers, locale }: SubscriberListProps ) => {
	const translate = useTranslate();
	return (
		<ul className="subscriber-list" role="table">
			<li className="row header" role="row">
				<span className="subscriber-list__checkbox-column hidden" role="columnheader">
					<FormCheckbox />
				</span>
				<span className="subscriber-list__profile-column" role="columnheader">
					{ translate( 'Name' ) }
				</span>
				<span className="subscriber-list__subscription-type-column hidden" role="columnheader">
					{ translate( 'Subscription type' ) }
				</span>
				<span className="subscriber-list__rate-column hidden" role="columnheader">
					{ translate( 'Open Rate' ) }
				</span>
				<span className="subscriber-list__since-column" role="columnheader">
					{ translate( 'Since' ) }
				</span>
				<span className="subscriber-list__menu-column" role="columnheader"></span>
			</li>
			{ subscribers.map(
				( {
					user_id,
					subscription_id,
					display_name,
					email_address,
					subscriptions,
					openRate,
					date_subscribed,
					avatar,
				}: Subscriber ) => (
					<SubscriberRow
						user_id={ user_id }
						key={ subscription_id }
						subscription_id={ subscription_id }
						display_name={ display_name }
						email_address={ email_address }
						subscriptions={ subscriptions }
						openRate={ openRate }
						date_subscribed={ date_subscribed }
						avatar={ avatar }
						locale={ locale }
					/>
				)
			) }
		</ul>
	);
};

import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import { flowRight as compose, isEmpty, get } from 'lodash';
import { useDispatch } from 'react-redux';
import ReaderAvatar from 'calypso/blocks/reader-avatar';
import ReaderListItemPlaceholder from 'calypso/blocks/reader-list-item/placeholder';
import ReaderSiteNotificationSettings from 'calypso/blocks/reader-site-notification-settings';
import ExternalLink from 'calypso/components/external-link';
import { withLocalizedMoment } from 'calypso/components/localized-moment';
import ReaderFollowFeedIcon from 'calypso/reader/components/icons/follow-feed-icon';
import ReaderFollowingFeedIcon from 'calypso/reader/components/icons/following-feed-icon';
import FollowButton from 'calypso/reader/follow-button';
import {
	getSiteName,
	getSiteDescription,
	getSiteAuthorName,
	getFeedUrl,
	getSiteUrl,
} from 'calypso/reader/get-helpers';
import { formatUrlForDisplay } from 'calypso/reader/lib/feed-display-helper';
import { getStreamUrl } from 'calypso/reader/route';
import { recordRailcar } from 'calypso/reader/stats';
import { recordReaderTracksEvent } from 'calypso/state/reader/analytics/actions';

import './style.scss';

function ReaderListItem( {
	moment,
	translate,
	url,
	feedId,
	feed,
	siteId,
	site,
	className = '',
	followSource,
	showNotificationSettings,
	showLastUpdatedDate,
	isFollowing,
	railcar,
} ) {
	const siteTitle = getSiteName( { feed, site } );
	const siteAuthor = site && site.owner;
	const siteExcerpt = getSiteDescription( { feed, site } );
	const authorName = getSiteAuthorName( site );
	const siteIcon = get( site, 'icon.img' );
	const feedIcon = get( feed, 'image' );
	const streamUrl = getStreamUrl( feedId, siteId );
	const feedUrl = url || getFeedUrl( { feed, site } );
	const siteUrl = getSiteUrl( { feed, site } );
	const isMultiAuthor = get( site, 'is_multi_author', false );
	const preferGravatar = ! isMultiAuthor;
	const dispatch = useDispatch();

	if ( ! site && ! feed ) {
		return <ReaderListItemPlaceholder />;
	}

	const recordEvent = ( eventName ) => {
		const eventProps = {
			blog_id: siteId,
			feed_id: feedId,
			source: followSource,
		};

		dispatch( recordReaderTracksEvent( eventName, eventProps ) );

		if ( railcar ) {
			recordRailcar( eventName, railcar, eventProps );
		}
	};

	const recordTitleClick = () => recordEvent( 'calypso_reader_feed_link_clicked' );
	const recordAuthorClick = () => recordEvent( 'calypso_reader_author_link_clicked' );
	const recordSiteUrlClick = () => recordEvent( 'calypso_reader_site_url_clicked' );
	const recordAvatarClick = () => recordEvent( 'calypso_reader_avatar_clicked' );

	return (
		<div className={ classnames( 'reader-list-item', className ) }>
			<div className="reader-list-item__avatar">
				<ReaderAvatar
					siteIcon={ siteIcon }
					feedIcon={ feedIcon }
					author={ siteAuthor }
					preferBlavatar={ isMultiAuthor }
					preferGravatar={ preferGravatar }
					siteUrl={ streamUrl }
					isCompact={ true }
					onClick={ recordAvatarClick }
				/>
			</div>
			<div className="reader-list-item__byline">
				<span className="reader-list-item__site-title">
					<a href={ streamUrl } className="reader-list-item__link" onClick={ recordTitleClick }>
						{ siteTitle }
					</a>
				</span>
				<div className="reader-list-item__site-excerpt">{ siteExcerpt }</div>
				{ ! isMultiAuthor && ! isEmpty( authorName ) && (
					<span className="reader-list-item__by-text">
						{ translate( 'by {{author/}}', {
							components: {
								author: (
									<a
										href={ streamUrl }
										className="reader-list-item__link"
										onClick={ recordAuthorClick }
									>
										{ authorName }
									</a>
								),
							},
						} ) }
					</span>
				) }
				{ siteUrl && (
					<div className="reader-list-item__site-url-timestamp">
						<ExternalLink
							href={ siteUrl }
							className="reader-list-item__site-url"
							onClick={ recordSiteUrlClick }
							icon={ true }
							iconSize={ 14 }
							target="_blank"
						>
							{ formatUrlForDisplay( siteUrl ) }
						</ExternalLink>
						{ showLastUpdatedDate && feed && feed.last_update && (
							<span className="reader-list-item__timestamp">
								{ translate( 'updated %s', { args: moment( feed.last_update ).fromNow() } ) }
							</span>
						) }
					</div>
				) }
			</div>
			<div className="reader-list-item__options">
				<FollowButton
					siteUrl={ feedUrl }
					followSource={ followSource }
					feedId={ feedId }
					siteId={ siteId }
					railcar={ railcar }
					followIcon={ ReaderFollowFeedIcon( { iconSize: 20 } ) }
					followingIcon={ ReaderFollowingFeedIcon( { iconSize: 20 } ) }
				/>
				{ isFollowing && showNotificationSettings && (
					<ReaderSiteNotificationSettings siteId={ siteId } />
				) }
			</div>
		</div>
	);
}

export default compose( localize, withLocalizedMoment )( ReaderListItem );

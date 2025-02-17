import { updateLaunchpadSettings } from '@automattic/data-stores';
import { localize } from 'i18n-calypso';
import { useEffect } from 'react';
import QueryKeyringConnections from 'calypso/components/data/query-keyring-connections';
import QueryKeyringServices from 'calypso/components/data/query-keyring-services';
import QueryP2Connections from 'calypso/components/data/query-p2-connections';
import QueryPublicizeConnections from 'calypso/components/data/query-publicize-connections';
import InlineSupportLink from 'calypso/components/inline-support-link';
import { useRequestSiteChecklistTaskUpdate } from 'calypso/data/site-checklist';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import { CHECKLIST_KNOWN_TASKS } from 'calypso/state/data-layer/wpcom/checklist/index.js';
import SharingServicesGroup from './services-group';

const SharingConnections = ( { translate, isP2Hub, siteId, siteSlug } ) => {
	useRequestSiteChecklistTaskUpdate( siteId, CHECKLIST_KNOWN_TASKS.POST_SHARING_ENABLED );

	useEffect( () => {
		// Mark the task as done
		updateLaunchpadSettings( siteSlug, {
			checklist_statuses: { drive_traffic: true },
		} );
	}, [] );

	return (
		<div className="connections__sharing-settings connections__sharing-connections">
			<PageViewTracker path="/marketing/connections/:site" title="Marketing > Connections" />

			{ isP2Hub && <QueryP2Connections siteId={ siteId } /> }
			{ ! isP2Hub && <QueryKeyringConnections /> }
			{ ! isP2Hub && <QueryPublicizeConnections selectedSite /> }
			{ ! isP2Hub && (
				<SharingServicesGroup
					type="publicize"
					title={ translate( 'Share posts with Jetpack Social {{learnMoreLink/}}', {
						components: {
							learnMoreLink: (
								<InlineSupportLink
									linkTitle={ translate( 'Learn more about sharing posts with Jetpack Social' ) }
									supportContext="publicize"
									showText={ false }
								/>
							),
						},
					} ) }
				/>
			) }

			<QueryKeyringServices />
			<SharingServicesGroup
				type="other"
				title={ translate( 'Manage connections' ) }
				numberOfPlaceholders={ isP2Hub ? 2 : undefined }
			/>
		</div>
	);
};

export default localize( SharingConnections );

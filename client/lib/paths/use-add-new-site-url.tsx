import config from '@automattic/calypso-config';
import { Primitive } from 'utility-types';
import { useIsCurrentlyHostingFlow } from 'calypso/landing/stepper/utils/hosting-flow';
import isJetpackCloud from 'calypso/lib/jetpack/is-jetpack-cloud';
import { addQueryArgs } from 'calypso/lib/url';

export const useAddNewSiteUrl = ( queryParameters: Record< string, Primitive > ) => {
	const isHostingFlow = useIsCurrentlyHostingFlow();

	return addQueryArgs(
		queryParameters,
		// eslint-disable-next-line no-nested-ternary
		isJetpackCloud()
			? config( 'jetpack_connect_url' )
			: isHostingFlow
			? '/setup/new-hosted-site'
			: config( 'signup_url' )
	);
};

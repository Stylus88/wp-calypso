import { isTailoredSignupFlow } from '@automattic/onboarding';
import { getQueryArg } from '@wordpress/url';
import debugFactory from 'debug';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { navigate } from 'calypso/lib/navigate';
import {
	clearSignupDestinationCookie,
	getSignupCompleteFlowName,
	retrieveSignupDestination,
} from 'calypso/signup/storageUtils';

const debug = debugFactory( 'calypso:leave-checkout' );

export const leaveCheckout = ( {
	siteSlug,
	forceCheckoutBackUrl,
	previousPath,
	tracksEvent,
	createUserAndSiteBeforeTransaction,
}: {
	siteSlug?: string;
	forceCheckoutBackUrl?: string;
	previousPath?: string;
	tracksEvent: string;
	createUserAndSiteBeforeTransaction?: boolean;
} ): void => {
	recordTracksEvent( tracksEvent );
	debug( 'leaving checkout with args', {
		siteSlug,
		forceCheckoutBackUrl,
		previousPath,
		createUserAndSiteBeforeTransaction,
	} );

	const signupFlowName = getSignupCompleteFlowName();
	const redirectToParam = getQueryArg( window.location.href, 'redirect_to' );
	const launchpadURLRegex = /^\/setup\/[a-z][a-z\-_]*[a-z]\/launchpad\b/g;
	const launchpadURLRegexMatch = redirectToParam?.toString().match( launchpadURLRegex );

	if ( isTailoredSignupFlow( signupFlowName ) ) {
		const urlFromCookie = retrieveSignupDestination();
		if ( urlFromCookie ) {
			window.location.assign( urlFromCookie );
		}
	}

	if ( redirectToParam && launchpadURLRegexMatch ) {
		const launchpadUrl = redirectToParam?.toString();
		window.location.assign( launchpadUrl );
		return;
	}

	if ( forceCheckoutBackUrl ) {
		window.location.href = forceCheckoutBackUrl;
		return;
	}

	let closeUrl = siteSlug ? '/plans/' + siteSlug : '/start';

	if (
		previousPath &&
		'' !== previousPath &&
		previousPath !== window.location.href &&
		! previousPath.includes( '/checkout/' )
	) {
		closeUrl = previousPath;
	}

	try {
		const searchParams = new URLSearchParams( window.location.search );

		if ( searchParams.has( 'signup' ) ) {
			clearSignupDestinationCookie();
		}

		if ( createUserAndSiteBeforeTransaction ) {
			try {
				window.localStorage.removeItem( 'shoppingCart' );
				window.localStorage.removeItem( 'siteParams' );
			} catch ( err ) {}

			// We use window.location instead of page.redirect() so that if the user already has an account and site at
			// this point, then window.location will reload with the cookies applied and takes to the /plans page.
			// (page.redirect() will take to the log in page instead).
			window.location.href = closeUrl;
			return;
		}

		if ( searchParams.has( 'cancel_to' ) ) {
			const cancelPath = searchParams.get( 'cancel_to' ) ?? '';
			// Only allow redirecting to relative paths.
			if ( cancelPath.match( /^\/(?!\/)/ ) ) {
				navigate( cancelPath );
				return;
			}
		}
	} catch ( error ) {
		// Silently ignore query string errors (eg: which may occur in IE since it doesn't support URLSearchParams).
		// eslint-disable-next-line no-console
		console.error( 'Error getting query string in close button' );
	}

	navigate( closeUrl );
};

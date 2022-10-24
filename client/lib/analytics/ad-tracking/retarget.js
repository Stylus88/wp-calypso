import { refreshCountryCodeCookieGdpr } from 'calypso/lib/analytics/utils';
import { mayWeTrackByTracker, AdTracker, mayWeTrackByBucket, Bucket } from '../tracker-buckets';
import {
	debug,
	TRACKING_IDS,
	ICON_MEDIA_RETARGETING_PIXEL_URL,
	YAHOO_GEMINI_AUDIENCE_BUILDING_PIXEL_URL,
} from './constants';
import { recordPageViewInFloodlight } from './floodlight';
import { loadTrackingScripts } from './load-tracking-scripts';

// Ensure setup has run.
import './setup';

// Retargeting events are fired once every `retargetingPeriod` seconds.
const retargetingPeriod = 60 * 60 * 24;

// Last time the retarget() function effectively fired (Unix time in seconds).
let lastRetargetTime = 0;

/**
 * Fire tracking events for the purposes of retargeting on all Calypso pages
 *
 * @param {string} urlPath The URL path we should report to the ad-trackers which may be different from the actual one
 * for privacy reasons.
 * @returns {void}
 */
export async function retarget( urlPath ) {
	await refreshCountryCodeCookieGdpr();

	if ( ! mayWeTrackByBucket( Bucket.ADVERTISING ) ) {
		debug( 'retarget: [Skipping] ad tracking is not allowed', urlPath );
		return;
	}

	await loadTrackingScripts();

	debug( 'retarget:', urlPath );

	// Non rate limited retargeting (main trackers)

	// Quantcast
	if ( mayWeTrackByTracker( AdTracker.QUANTCAST ) ) {
		const params = {
			qacct: TRACKING_IDS.quantcast,
			event: 'refresh',
		};
		debug( 'retarget: [Quantcast]', params );
		window._qevents.push( params );
	}

	// Facebook
	if ( mayWeTrackByTracker( AdTracker.FACEBOOK ) ) {
		const params = [ 'trackSingle', TRACKING_IDS.facebookInit, 'PageView' ];
		debug( 'retarget: [Facebook]', params );
		window.fbq( ...params );
	}

	// Bing
	if ( mayWeTrackByTracker( AdTracker.BING ) ) {
		debug( 'retarget: [Bing]' );
		window.uetq.push( 'pageLoad' );
	}

	// Wordpress.com Google Ads Gtag
	if ( mayWeTrackByTracker( AdTracker.GOOGLE_ADS ) ) {
		const params = [ 'config', TRACKING_IDS.wpcomGoogleAdsGtag, { page_path: urlPath } ];
		debug( 'retarget: [Google Ads] WPCom', params );
		window.gtag( ...params );
	}

	// Floodlight
	recordPageViewInFloodlight( urlPath );

	// Pinterest
	if ( mayWeTrackByTracker( AdTracker.PINTEREST ) ) {
		debug( 'retarget: [Pinterest]' );
		window.pintrk( 'page' );
	}

	// AdRoll
	if ( mayWeTrackByTracker( AdTracker.ADROLL ) ) {
		debug( 'retarget: [AdRoll]' );
		window.adRoll.trackPageview();
	}

	// Rate limited retargeting (secondary trackers)

	const nowTimestamp = Date.now() / 1000;
	if ( nowTimestamp >= lastRetargetTime + retargetingPeriod ) {
		lastRetargetTime = nowTimestamp;

		// Outbrain
		if ( mayWeTrackByTracker( AdTracker.OUTBRAIN ) ) {
			const params = [ 'track', 'PAGE_VIEW' ];
			debug( 'retarget: [Outbrain] [rate limited]', params );
			window.obApi( ...params );
		}

		// Icon Media
		if ( mayWeTrackByTracker( AdTracker.ICON_MEDIA ) ) {
			const params = ICON_MEDIA_RETARGETING_PIXEL_URL;
			debug( 'retarget: [Icon Media] [rate limited]', params );
			new window.Image().src = params;
		}

		// Twitter
		if ( mayWeTrackByTracker( AdTracker.TWITTER ) ) {
			const params = [ 'track', 'PageView' ];
			debug( 'retarget: [Twitter] [rate limited]', params );
			window.twq( ...params );
		}

		// Yahoo Gemini
		if ( mayWeTrackByTracker( AdTracker.GEMINI ) ) {
			const params = YAHOO_GEMINI_AUDIENCE_BUILDING_PIXEL_URL;
			debug( 'retarget: [Yahoo Gemini] [rate limited]', params );
			new window.Image().src = params;
		}

		// Quora
		if ( mayWeTrackByTracker( AdTracker.QUORA ) ) {
			const params = [ 'track', 'ViewContent' ];
			debug( 'retarget: [Quora] [rate limited]', params );
			window.qp( ...params );
		}
	}

	// uses JSON.stringify for consistency with recordOrder()
	debug( 'retarget: dataLayer:', JSON.stringify( window.dataLayer, null, 2 ) );
}

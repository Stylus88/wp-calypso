/**
 * These are the known places that Calypso is allowed to run.
 */
const ALLOWED_ORIGINS = [
	'https://wordpress.com',
	'https://horizon.wordpress.com',
	'https://wpcalypso.wordpress.com',
	'http://calypso.localhost:3000',
	'https://calypso.localhost:3000',
];

/**
 * Checks if the origin is allowed by checking against ALLOWED_ORIGINS.
 *
 * @param origin string to check
 * @returns true if the origin is allowed
 */
function isAllowedOrigin( origin: string ) {
	return ALLOWED_ORIGINS.includes( origin ) || isCalypsoLive( origin );
}

/**
 * Checks if the origin is a Calypso Live site (e.g. https://busy-badger.calypso.live)
 *
 * @param origin string to check
 * @returns true if the origin is a Calypso Live site
 */
function isCalypsoLive( origin: string ) {
	return origin.match( /^https:\/\/[a-z0-9-]+\.calypso\.live$/ );
}

/**
 * From wp-admin contexts: gets the Calypso origin from 1. the `origin` query arg and 2. the HTTP referrer and compares it against a list of allowed wpcom origins.
 
 * This is designed for usage in the Editor or other wp-admin contexts.
 *
 * @param path Optional path to append to the origin
 * @returns The origin if it's allowed, otherwise the default origin (wordpress.com)
 */
export function getWpComOrigin( path = '' ) {
	const defaultOrigin = 'https://wordpress.com';
	const fromReferrer = document.referrer;
	const fromQueryArg = new URLSearchParams( window.location.search ).get( 'calypso_origin' ) || '';
	let origin = defaultOrigin;

	if ( isAllowedOrigin( fromQueryArg ) ) {
		origin = fromQueryArg;
	} else if ( isAllowedOrigin( fromReferrer ) ) {
		origin = fromReferrer;
	}

	if ( path.length ) {
		// remove beginning slash from path if present
		path = path.replace( /^\//, '' );
		origin = `${ origin }/${ path }`;
	}

	return origin;
}

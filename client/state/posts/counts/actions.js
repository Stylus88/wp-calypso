import wpcom from 'calypso/lib/wp';
import {
	POST_COUNTS_RECEIVE,
	POST_COUNTS_REQUEST,
	POST_COUNTS_REQUEST_SUCCESS,
	POST_COUNTS_REQUEST_FAILURE,
} from 'calypso/state/action-types';

import 'calypso/state/posts/init';

/**
 * Returns an action object signalling that post counts have been received for
 * the site and post type.
 *
 * @param  {number} siteId   Site ID
 * @param  {string} postType Post type
 * @param  {Object} counts   Mapping of post status to count
 * @returns {Object}          Action object
 */
export function receivePostCounts( siteId, postType, counts ) {
	return {
		type: POST_COUNTS_RECEIVE,
		siteId,
		postType,
		counts,
	};
}

/**
 * Returns an action thunk, dispatching progress of a request to retrieve post
 * counts for a site and post type.
 *
 * @param  {number}   siteId   Site ID
 * @param  {string}   postType Post type
 * @returns {Function}          Action thunk
 */
export function requestPostCounts( siteId, postType ) {
	return ( dispatch ) => {
		dispatch( {
			type: POST_COUNTS_REQUEST,
			postType,
			siteId,
		} );

		return wpcom.req
			.get( `/sites/${ siteId }/post-counts/${ postType }`, { apiNamespace: 'wpcom/v2' } )
			.then( ( data ) => {
				dispatch( receivePostCounts( siteId, postType, data.counts ) );
				dispatch( {
					type: POST_COUNTS_REQUEST_SUCCESS,
					siteId,
					postType,
				} );
			} )
			.catch( ( error ) => {
				dispatch( {
					type: POST_COUNTS_REQUEST_FAILURE,
					siteId,
					postType,
					error,
				} );
			} );
	};
}

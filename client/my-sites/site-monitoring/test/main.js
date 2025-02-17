/**
 * @jest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { useSiteMetricsData } from '../main';
import { useSiteMetricsQuery } from '../use-metrics-query';

jest.mock( 'calypso/my-sites/site-monitoring/use-metrics-query.ts', () => ( {
	__esModule: true,
	useSiteMetricsQuery: jest.fn( () => {
		return {
			data: {
				data: { periods: [] },
			},
		};
	} ),
} ) );

const INITIAL_STATE = {
	sites: {
		items: {},
	},
	ui: {
		selectedSiteId: '1',
	},
};

const mockStore = configureStore();
const store = mockStore( INITIAL_STATE );
const queryClient = new QueryClient();

describe( 'useSiteMetrics test', () => {
	beforeAll( () => {
		// Mock the missing `window.matchMedia` function that's not even in JSDOM
		Object.defineProperty( window, 'matchMedia', {
			writable: true,
			value: jest.fn().mockImplementation( ( query ) => ( {
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(), // deprecated
				removeListener: jest.fn(), // deprecated
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			} ) ),
		} );
		jest.clearAllMocks();
	} );

	it( 'should return formattedData for the case with an empty array for dimension', () => {
		useSiteMetricsQuery.mockReturnValueOnce( {
			data: {
				data: { periods: [ { timestamp: 1685577600, dimension: [] } ] },
			},
		} );

		// Define a wrapper function to wrap the test component with QueryClientProvider and Redux Provider
		const wrapper = ( { children } ) => (
			<QueryClientProvider client={ queryClient }>
				<Provider store={ store }>{ children }</Provider>
			</QueryClientProvider>
		);

		// Call the useSiteMetricsData function directly within the test
		const { result } = renderHook( () => useSiteMetricsData(), { wrapper } );

		// Get the formattedData from the hook's result
		const { formattedData } = result.current;

		// Make your assertions based on the expected formattedData
		expect( formattedData ).toEqual( [
			[ 1685577600 ], // Array of timestamps
			[ 0 ], // Array of dimension values
		] );
	} );

	it( 'should return formattedData for the case with an object for dimension', () => {
		useSiteMetricsQuery.mockReturnValueOnce( {
			data: {
				data: {
					periods: [
						{ timestamp: 1685577600, dimension: { 'example.com': 0.0030000000000000005 } },
					],
				},
			},
		} );

		const wrapper = ( { children } ) => (
			<QueryClientProvider client={ queryClient }>
				<Provider store={ store }>{ children }</Provider>
			</QueryClientProvider>
		);

		const { result } = renderHook( () => useSiteMetricsData(), { wrapper } );

		const { formattedData } = result.current;

		expect( formattedData ).toEqual( [ [ 1685577600 ], [ 0.0030000000000000005 ] ] );
	} );
} );

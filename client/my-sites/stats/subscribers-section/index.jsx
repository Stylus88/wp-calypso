import { formattedNumber } from '@automattic/components';
import { useMemo } from 'react';
import { LineChart } from 'react-light-chart';
import StatsEmptyState from '../stats-empty-state';
import './style.scss';

// New Subscriber Stats
// We don't have any data yet so we are just using some test data.
// Currently using the LineChart component from the Calypso library.

function useData() {
	// From D105106-code -- Work in progress on new endpoint.
	return useMemo( () => {
		const data = [
			[ '2023-03-01', 51131, 547 ],
			[ '2023-02-01', 51881, 750 ],
			[ '2023-01-01', 52662, 781 ],
			[ '2022-12-01', 52782, 120 ],
			[ '2022-11-01', 53541, 759 ],
			[ '2022-10-01', 53527, -14 ],
			[ '2022-09-01', 53853, 326 ],
			[ '2022-08-01', 54243, 390 ],
			[ '2022-07-01', 55097, 854 ],
			[ '2022-06-01', 55088, -9 ],
			[ '2022-05-01', 55208, 120 ],
			[ '2022-04-01', 55764, 556 ],
			[ '2022-03-01', 56622, 858 ],
			[ '2022-02-01', 57363, 741 ],
			[ '2022-01-01', 57279, -84 ],
			[ '2021-12-01', 57468, 189 ],
			[ '2021-11-01', 57444, -24 ],
			[ '2021-10-01', 57530, 86 ],
			[ '2021-09-01', 58404, 874 ],
			[ '2021-08-01', 58468, 64 ],
			[ '2021-07-01', 58512, 44 ],
			[ '2021-06-01', 59469, 957 ],
			[ '2021-05-01', 59795, 326 ],
			[ '2021-04-01', 60511, 716 ],
			[ '2021-03-01', 61193, 682 ],
			[ '2021-02-01', 61448, 255 ],
			[ '2021-01-01', 61682, 234 ],
			[ '2020-12-01', 61934, 252 ],
			[ '2020-11-01', 62927, 993 ],
			[ '2020-10-01', 62957, 30 ],
			[ '2020-09-01', 63385, 428 ],
		];
		return data.map( ( d ) => ( { x: d[ 0 ], y: d[ 1 ], yDelta: d[ 2 ] } ) );
	}, [] );
}

// TODO: Replace with popover and corresponding styling.
const Tooltip = ( { data: { x, y }, labels, position: positionStyle } ) => {
	return (
		<div className="subscriber-section__chart-tooltip" style={ positionStyle }>
			<b style={ { color: labels[ 0 ].labelColor } }>{ x }</b>
			{ ': ' }
			<span>{ formattedNumber( y ) } subscribers</span>
		</div>
	);
};

const useChartConfig = () => {
	return useMemo(
		() => ( {
			indexSelector: ( d ) => d.x,
			renderTooltip: Tooltip,
			style: { width: '100%', height: 400 },
			valueSelector: ( d ) => d.y,
		} ),
		[]
	);
};

export default function SubscribersSection() {
	const data = useData();

	return (
		<div className="subscribers-section">
			<h1 className="highlight-cards-heading">Subscribers</h1>
			<StatsEmptyState />

			<LineChart
				data={ data }
				valueAxis={ {
					minimumValue: Math.min( ...data.map( ( d ) => d.y ) ) * 0.95,
					maximumValue: Math.max( ...data.map( ( d ) => d.y ) ) * 1.05,
				} }
				{ ...useChartConfig() }
			/>
		</div>
	);
}

import { CardHeader, Button, Flex, TabPanel } from '@wordpress/components';
import { closeSmall, chevronUp, lineSolid, commentContent, page, Icon } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import classnames from 'classnames';
import { useEffect, useState } from 'react';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { useHCWindowCommunicator } from '../happychat-window-communicator';
import type { Header, WindowState } from '../types';
import type { ReactElement } from 'react';

interface TabNameMap {
	'/': string;
	'/next-steps-tutorials': string;
}

const HELP_TAB_NAME = 'help';
const NEXT_STEPS_TAB_NAME = 'next-steps-tutorials';

function getInitialTabName( pathname: keyof TabNameMap = '/' ): string {
	const tabNameMap = {
		'/': HELP_TAB_NAME,
		'/next-steps-tutorials': NEXT_STEPS_TAB_NAME,
	};

	if ( pathname in tabNameMap ) return tabNameMap[ pathname ];

	return '/';
}

export function ArticleTitle() {
	const { search } = useLocation();
	const params = new URLSearchParams( search );
	return (
		<>
			<Icon icon={ page } />
			<span className="help-center-header__article-title">{ params.get( 'title' ) }</span>
		</>
	);
}

const SupportModeTitle = (): ReactElement => {
	const { __ } = useI18n();
	const { search } = useLocation();
	const params = new URLSearchParams( search );

	const mode = params.get( 'mode' );
	switch ( mode ) {
		case 'CHAT':
			return (
				<>
					<Icon icon={ commentContent } />
					{ __( 'Start live chat', __i18n_text_domain__ ) }
				</>
			);
		case 'EMAIL': {
			return <>{ __( 'Send us an email', __i18n_text_domain__ ) }</>;
		}
		case 'FORUM': {
			return <>{ __( 'Ask in our community forums', __i18n_text_domain__ ) }</>;
		}
		default: {
			return <>{ __( 'Help Center', __i18n_text_domain__ ) }</>;
		}
	}
};
const HelpCenterHeader: React.FC< Header > = ( {
	isMinimized,
	onMinimize,
	onMaximize,
	onDismiss,
} ) => {
	const classNames = classnames( 'help-center__container-header' );
	const { __ } = useI18n();
	const [ chatWindowStatus, setChatWindowStatus ] = useState< WindowState >( 'closed' );
	const [ unreadCount, setUnreadCount ] = useState< number >( 0 );
	const history = useHistory();
	const { pathname } = useLocation();
	const { loadNextStepsTutorial } = useFeatureFlags();

	const initialTabName = getInitialTabName( pathname );
	const formattedUnreadCount = unreadCount > 9 ? '9+' : unreadCount;

	function requestMaximize() {
		onMaximize?.();
	}

	// kill the help center when the user closes the popup chat window
	useEffect( () => {
		if ( chatWindowStatus === 'ended' ) {
			onDismiss?.();
		}
	}, [ chatWindowStatus, onDismiss ] );

	useHCWindowCommunicator( setChatWindowStatus, setUnreadCount );

	return (
		<>
			<CardHeader className={ classNames }>
				<Flex>
					<p id="header-text" className="help-center-header__text">
						{ isMinimized ? (
							<Switch>
								<Route path="/" exact>
									{ __( 'Help Center', __i18n_text_domain__ ) }
								</Route>
								<Route path="/next-steps-tutorials" exact>
									{ __( 'Help Center', __i18n_text_domain__ ) }
								</Route>
								<Route path="/contact-options">
									{ __( 'Contact Options', __i18n_text_domain__ ) }
								</Route>
								<Route path="/contact-form" component={ SupportModeTitle }></Route>
								<Route path="/post" component={ ArticleTitle }></Route>
							</Switch>
						) : (
							__( 'Help Center', __i18n_text_domain__ )
						) }
						{ isMinimized && unreadCount ? (
							<span className="help-center-header__unread-count">{ formattedUnreadCount }</span>
						) : null }
					</p>
					<div>
						{ isMinimized ? (
							<Button
								className={ 'help-center-header__maximize' }
								label={ __( 'Maximize Help Center', __i18n_text_domain__ ) }
								icon={ chevronUp }
								tooltipPosition="top left"
								onClick={ requestMaximize }
							/>
						) : (
							<Button
								className={ 'help-center-header__minimize' }
								label={ __( 'Minimize Help Center', __i18n_text_domain__ ) }
								icon={ lineSolid }
								tooltipPosition="top left"
								onClick={ onMinimize }
							/>
						) }

						<Button
							className={ 'help-center-header__close' }
							label={ __( 'Close Help Center', __i18n_text_domain__ ) }
							tooltipPosition="top left"
							icon={ closeSmall }
							onClick={ onDismiss }
						/>
					</div>
				</Flex>
			</CardHeader>
			{ ! isMinimized && loadNextStepsTutorial && (
				<TabPanel
					className="help-center-header__tab-panel"
					initialTabName={ initialTabName }
					tabs={ [
						{
							name: NEXT_STEPS_TAB_NAME,
							title: 'Next Steps',
							className: 'help-center-container__next-steps-tab',
						},
						{
							name: HELP_TAB_NAME,
							title: 'Help',
							className: 'help-center-container__help-tab',
						},
					] }
					onSelect={ ( tab ) => {
						if ( tab === NEXT_STEPS_TAB_NAME ) {
							history.push( '/next-steps-tutorials' );
						} else if ( tab === HELP_TAB_NAME ) {
							history.push( '/' );
						}
					} }
				>
					{ () => {
						return <></>;
					} }
				</TabPanel>
			) }
		</>
	);
};

export default HelpCenterHeader;

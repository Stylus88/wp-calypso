import { APIProductFamilyProduct } from 'calypso/state/partner-portal/types';

// All types based on which the data is populated on the agency dashboard table rows
export type AllowedTypes = 'site' | 'stats' | 'boost' | 'backup' | 'scan' | 'monitor' | 'plugin';

// Site column object which holds key and title of each column
export type SiteColumns = Array< {
	key: AllowedTypes;
	title: string;
	className?: string;
	isExpandable?: boolean;
	isSortable?: boolean;
} >;

export type AllowedStatusTypes =
	| 'active'
	| 'inactive'
	| 'progress'
	| 'failed'
	| 'warning'
	| 'success'
	| 'disabled'
	| 'critical';

interface MonitorContactEmail {
	name: string;
	email_address: string;
	verified: boolean;
}
interface MonitorContactSMS {
	name: string;
	sms_number: string;
	number: string;
	country_code: string;
	country_numeric_code: string;
	verified: boolean;
}
interface MonitorContacts {
	emails?: Array< MonitorContactEmail >;
	sms_numbers?: Array< MonitorContactSMS >;
}

export interface MonitorSettings {
	monitor_active: boolean;
	monitor_site_status: boolean;
	last_down_time: string;
	monitor_deferment_time: number;
	monitor_user_emails: Array< string >;
	monitor_user_email_notifications: boolean;
	monitor_user_sms_notifications: boolean;
	monitor_user_wp_note_notifications: boolean;
	monitor_notify_additional_user_emails: Array< MonitorContactEmail >;
	monitor_notify_additional_user_sms: Array< MonitorContactSMS >;
}

interface StatsObject {
	total: number;
	trend: 'up' | 'down' | 'same';
	trend_change: number;
}
export interface SiteStats {
	views: StatsObject;
	visitors: StatsObject;
}

export interface BoostData {
	overall: number;
	mobile: number;
	desktop: number;
}

export interface Site {
	blog_id: number;
	url: string;
	url_with_scheme: string;
	monitor_active: boolean;
	monitor_site_status: boolean;
	has_scan: boolean;
	has_backup: boolean;
	has_boost: boolean;
	latest_scan_threats_found: Array< string >;
	latest_backup_status: string;
	is_connection_healthy: boolean;
	awaiting_plugin_updates: Array< string >;
	is_favorite: boolean;
	monitor_settings: MonitorSettings;
	monitor_last_status_change: string;
	isSelected?: boolean;
	site_stats: SiteStats;
	onSelect?: () => void;
	jetpack_boost_scores: BoostData;
	php_version_num: number;
	is_connected: boolean;
}
export interface SiteNode {
	value: Site;
	error: boolean;
	type: AllowedTypes;
	status: AllowedStatusTypes;
}

export interface StatsNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: SiteStats;
}

export interface BoostNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: BoostData;
}
export interface BackupNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: string;
}

export interface ScanNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: string;
	threats: number;
}

interface PluginNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: string;
	updates: number;
}
export interface MonitorNode {
	type: AllowedTypes;
	status: AllowedStatusTypes;
	value: string;
	error?: boolean;
	settings?: MonitorSettings;
}
export interface SiteData {
	site: SiteNode;
	stats: StatsNode;
	boost: BoostNode;
	backup: BackupNode;
	scan: ScanNode;
	plugin: PluginNode;
	monitor: MonitorNode;
	isFavorite?: boolean;
	isSelected?: boolean;
	onSelect?: () => void;
}

export interface RowMetaData {
	row: {
		value: Site | SiteStats | BoostData | string;
		status: AllowedStatusTypes;
	};
	link: string;
	isExternalLink: boolean;
	tooltip?: string;
	tooltipId: string;
	siteDown?: boolean;
	eventName: string | undefined;
}

export type PreferenceType = 'dismiss' | 'view' | 'view_date';

export type Preference = {
	dismiss?: boolean;
	view?: boolean;
	view_date?: string;
};

export type StatusEventNames = {
	[ key in AllowedStatusTypes ]?: { small_screen: string; large_screen: string };
};

export type StatusTooltip = {
	[ key in AllowedStatusTypes ]?: string;
};

export type AllowedActionTypes =
	| 'issue_license'
	| 'view_activity'
	| 'view_site'
	| 'visit_wp_admin'
	| 'clone_site'
	| 'site_settings';

export type ActionEventNames = {
	[ key in AllowedActionTypes ]: { small_screen: string; large_screen: string };
};

export interface DashboardSortInterface {
	field: string;
	direction: 'asc' | 'desc' | '';
}
export interface DashboardOverviewContextInterface {
	search: string;
	currentPage: number;
	filter: { issueTypes: Array< AgencyDashboardFilterOption >; showOnlyFavorites: boolean };
	sort: DashboardSortInterface;
}

export interface SitesOverviewContextInterface extends DashboardOverviewContextInterface {
	isBulkManagementActive: boolean;
	setIsBulkManagementActive: ( value: boolean ) => void;
	selectedSites: Array< Site >;
	setSelectedSites: ( value: Array< Site > ) => void;
	currentLicenseInfo: string | null;
	showLicenseInfo: ( license: string ) => void;
	hideLicenseInfo: () => void;
}

export interface DashboardDataContextInterface {
	verifiedContacts: {
		emails: Array< string >;
		phoneNumbers: Array< string >;
		refetchIfFailed: () => void;
	};
	products: APIProductFamilyProduct[];
}

export type AgencyDashboardFilterOption =
	| 'backup_failed'
	| 'backup_warning'
	| 'threats_found'
	| 'site_disconnected'
	| 'site_down'
	| 'plugin_updates';

export type AgencyDashboardFilter = {
	issueTypes: Array< AgencyDashboardFilterOption >;
	showOnlyFavorites: boolean;
};

export type ProductInfo = { name: string; key: string; status: 'rejected' | 'fulfilled' };

export type PurchasedProductsInfo = {
	selectedSite: string;
	selectedProducts: Array< ProductInfo >;
};

export interface APIError {
	status: number;
	code: string | null;
	message: string;
	data?: any;
}

export interface APIToggleFavorite {
	[ key: string ]: any;
}

export interface UpdateMonitorSettingsAPIResponse {
	success: boolean;
	settings: {
		email_notifications: boolean;
		sms_notifications: boolean;
		wp_note_notifications: boolean;
		jetmon_defer_status_down_minutes: number;
		contacts?: MonitorContacts;
	};
}

export interface UpdateMonitorSettingsParams {
	wp_note_notifications?: boolean;
	email_notifications?: boolean;
	sms_notifications?: boolean;
	jetmon_defer_status_down_minutes?: number;
	contacts?: MonitorContacts;
}
export interface UpdateMonitorSettingsArgs {
	siteId: number;
	params: UpdateMonitorSettingsParams;
}

export type SiteMonitorStatus = {
	[ siteId: number ]: 'loading' | 'completed';
};

export interface ToggleActivaateMonitorAPIResponse {
	code: 'success' | 'error';
	message: string;
}
export interface ToggleActivateMonitorArgs {
	siteId: number;
	params: { monitor_active: boolean };
}

export interface Backup {
	activityTitle: string;
	activityDescription: { children: { text: string }[] }[];
	activityName: string;
	activityTs: number;
}

export type AllowedMonitorPeriods = 'day' | 'week' | '30 days' | '90 days';

export interface MonitorUptimeAPIResponse {
	[ key: string ]: { status: string; downtime_in_minutes?: number };
}

export interface MonitorSettingsEmail {
	email: string;
	name: string;
	verified: boolean;
}

export interface StateMonitorSettingsSMS {
	name: string;
	countryCode: string;
	countryNumericCode: string;
	phoneNumber: string;
	phoneNumberFull: string;
	verified: boolean;
}

export interface StateMonitorSettingsEmail extends MonitorSettingsEmail {
	isDefault?: boolean;
}

export interface StateMonitorSettingsSMS {
	name: string;
	countryCode: string;
	phoneNumber: string;
	phoneNumberFull: string;
	verified: boolean;
}

export type MonitorSettingsContact = Partial< MonitorSettingsEmail > &
	Partial< StateMonitorSettingsSMS >;

export type AllowedMonitorContactActions = 'add' | 'verify' | 'edit' | 'remove';

export type AllowedMonitorContactTypes = 'email' | 'sms';

export type StateMonitoringSettingsContact = StateMonitorSettingsEmail | StateMonitorSettingsSMS;

export interface RequestVerificationCodeParams {
	type: AllowedMonitorContactTypes;
	value: string;
	site_ids: Array< number >;
	// For SMS contacts
	number?: string;
	country_code?: string;
	country_numeric_code?: string;
}

export interface ValidateVerificationCodeParams {
	type: AllowedMonitorContactTypes;
	value: string;
	verification_code: number;
}

export interface MonitorContactsResponse {
	emails: [ { verified: boolean; email_address: string } ];
	sms_numbers: [ { verified: boolean; sms_number: string; country_numeric_code: string } ];
}

export type MonitorDuration = { label: string; time: number };

export interface InitialMonitorSettings {
	enableSMSNotification: boolean;
	enableEmailNotification: boolean;
	enableMobileNotification: boolean;
	selectedDuration: MonitorDuration | undefined;
	emailContacts?: MonitorSettingsEmail[] | [];
	phoneContacts?: StateMonitorSettingsSMS[] | [];
}
export interface ResendVerificationCodeParams {
	type: 'email' | 'sms';
	value: string;
}

import { WpcomPlansUI } from '@automattic/data-stores';
import { CustomSelectControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { TranslateResult, useTranslate } from 'i18n-calypso';
import { PlanProperties } from '../types';
import { getStorageStringFromFeature } from '../util';

type StorageAddOnDropdownProps = {
	planProperties: PlanProperties;
};

export const StorageAddOnDropdown = ( { planProperties }: StorageAddOnDropdownProps ) => {
	const { planName, storageOptions } = planProperties;
	const translate = useTranslate();
	const { setStorageAddOnForPlan } = useDispatch( WpcomPlansUI.store );
	const selectedStorage = useSelect(
		( select ) => {
			return select( WpcomPlansUI.store ).getStorageAddOnForPlan()( planName );
		},
		[ planName ]
	);

	// TODO: Consider transforming storageOptions outside of this component
	const selectControlOptions = storageOptions.reduce(
		( acc: { key: string; name: TranslateResult }[], storageOption ) => {
			const title = getStorageStringFromFeature( storageOption.slug );
			if ( title ) {
				acc.push( {
					key: storageOption?.slug,
					name: title,
				} );
			}

			return acc;
		},
		[]
	);

	const defaultStorageOption = storageOptions.find( ( storageOption ) => ! storageOption?.isAddOn );
	const selectedOptionKey = selectedStorage || defaultStorageOption?.slug || '';
	const selectedOption = {
		key: selectedOptionKey,
		name: getStorageStringFromFeature( selectedOptionKey ),
	};
	return (
		<CustomSelectControl
			label={ translate( 'Storage' ) }
			options={ selectControlOptions }
			value={ selectedOption }
			onChange={ ( { selectedItem }: { selectedItem: { key?: string } } ) =>
				setStorageAddOnForPlan( { addOnSlug: selectedItem?.key || '', plan: planName } )
			}
		/>
	);
};

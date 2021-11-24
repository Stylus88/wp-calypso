import DesignPicker, { useCategorization } from '@automattic/design-picker';
import { englishLocales } from '@automattic/i18n-utils';
import { shuffle } from '@automattic/js-utils';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormattedHeader from 'calypso/components/formatted-header';
import { getRecommendedThemes as fetchRecommendedThemes } from 'calypso/state/themes/actions';
import { getRecommendedThemes } from 'calypso/state/themes/selectors';
import { BackButton } from '../components/back-button';

// Ideally this data should come from the themes API, maybe by a tag that's applied to
// themes? e.g. `link-in-bio` or `no-fold`
const STATIC_PREVIEWS = [ 'bantry', 'sigler', 'miller', 'pollard', 'paxton', 'jones', 'baker' ];

export function Design(): React.ReactElement {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const apiThemes = useSelector( ( state ) =>
		getRecommendedThemes( state, 'auto-loading-homepage' )
	);

	useEffect(
		() => {
			if ( ! apiThemes.length ) {
				dispatch( fetchRecommendedThemes( 'auto-loading-homepage' ) );
			}
		},
		// Ignoring dependencies because we only want these actions to run on first mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const designs = useMemo( () => {
		// TODO fetching and filtering code should be pulled to a shared place that's usable by both
		// `/start` and `/new` onboarding flows. Or perhaps fetching should be done within the <DesignPicker>
		// component itself. The `/new` environment needs helpers for making authenticated requests to
		// the theme API before we can do this.
		const allThemes = apiThemes.map( ( { id, name, taxonomies } ) => ( {
			categories: taxonomies?.theme_subject ?? [],
			// Blank Canvas uses the theme_picks taxonomy with a "featured" term in order to
			// appear prominently in theme galleries.
			showFirst: !! taxonomies?.theme_picks?.find( ( { slug } ) => slug === 'featured' ),
			features: [],
			is_premium: false,
			slug: id,
			template: id,
			theme: id,
			title: name,
			...( STATIC_PREVIEWS.includes( id ) && { preview: 'static' } ),
		} ) );

		if ( allThemes.length === 0 ) {
			return [];
		}

		return [ allThemes[ 0 ], ...shuffle( allThemes.slice( 1 ) ) ];
	}, [ apiThemes ] );

	const handleSelection = () => {
		throw new Error( 'not implemented' );
	};

	const categorization = useCategorization( designs, {
		showAllFilter: true,
	} );

	function subHeaderText() {
		const text = translate( 'Choose a starting theme. You can change it later.' );

		if ( englishLocales.includes( translate.localeSlug || '' ) ) {
			// An English only trick so the line wraps between sentences.
			return text
				.replace( /\s/g, '\xa0' ) // Replace all spaces with non-breaking spaces
				.replace( /\.\s/g, '. ' ); // Replace all spaces at the end of sentences with a regular breaking space
		}

		return text;
	}

	return (
		<div>
			<BackButton defaultBack={ undefined } />
			<DesignPicker
				designs={ designs }
				theme="light"
				locale={ translate.localeSlug }
				onSelect={ handleSelection }
				onPreview={ handleSelection }
				highResThumbnails
				categorization={ categorization }
				categoriesHeading={
					<FormattedHeader
						id="step-header"
						headerText={ translate( 'Themes' ) }
						subHeaderText={ subHeaderText() }
						align="left"
						hasScreenOptions={ false }
					/>
				}
			/>
		</div>
	);
}

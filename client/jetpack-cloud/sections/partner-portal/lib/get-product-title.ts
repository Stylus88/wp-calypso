/**
 * Format the string by removing Jetpack, (, ) from the product name
 *
 * @param product Product name
 * @returns Product title
 */
export default function getProductTitle( product: string ): string {
	if ( 'Jetpack AI' === product ) {
		return 'AI Assistant';
	}

	return product.replace( /(?:Jetpack\s|[)(])/gi, '' );
}

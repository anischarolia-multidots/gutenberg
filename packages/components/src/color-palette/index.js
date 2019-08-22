/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPicker from '../color-picker';
import CircularOptionPicker from '../circular-option-picker';

export default function ColorPalette( {
	className,
	colors,
	disableCustomColors = false,
	onChange,
	value,
} ) {
	const colorOptions = useMemo(
		() => {
			function applyOrUnset( color ) {
				return () => onChange( value === color ? undefined : color );
			}
			return map( colors, ( { color, name } ) => (
				<CircularOptionPicker.Option
					key={ color }
					isSelected={ value === color }
					tooltipText={ name ||
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
					style={ { color } }
					onClick={ applyOrUnset( color ) }
					aria-label={ name ?
						// translators: %s: The name of the color e.g: "vivid red".
						sprintf( __( 'Color: %s' ), name ) :
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
				/>
			) );
		},
		[ colors, value, onChange ]
	);
	const renderCustomColorPicker = useCallback(
		() => (
			<ColorPicker
				color={ value }
				onChangeComplete={ ( color ) => onChange( color.hex ) }
				disableAlpha
			/>
		),
		[ value ]
	);
	const clearColor = useCallback(
		() => onChange( undefined ),
		[ onChange ]
	);

	return (
		<CircularOptionPicker
			className={ className }
			options={ colorOptions }
			actions={ (
				<>
					{ ! disableCustomColors && (
						<CircularOptionPicker.DropdownLinkAction
							dropdownProps={ {
								renderContent: renderCustomColorPicker,
								contentClassName: 'components-color-palette__picker',
							} }
							buttonProps={ {
								ariaLabel: __( 'Custom color picker' ),
							} }
							linkText={ __( 'Custom Color' ) }
						/>
					) }
					<CircularOptionPicker.ButtonAction onClick={ clearColor }>
						{ __( 'Clear' ) }
					</CircularOptionPicker.ButtonAction>
				</>
			) }
		/>
	);
}

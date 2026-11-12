<?php
/**
 * A small line-icon set (24-unit grid, 1.75 stroke, round caps), drawn for this
 * theme so no icon font or library loads. Decorative: aria-hidden always.
 */

defined( 'ABSPATH' ) || exit;

function wm_icon( string $name, string $class = '' ): string {
	$paths = array(
		'pin'      => '<path d="M12 21s-7-6.1-7-11.2A7 7 0 0 1 19 9.8C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.6"/>',
		'clock'    => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
		'calendar' => '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
		'ticket'   => '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="1.5 2.2"/>',
		'users'    => '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5a6 6 0 0 1 12 0"/><path d="M15.5 5.4a3.3 3.3 0 0 1 0 6.3M21 19.5a6 6 0 0 0-3.8-5.6"/>',
		'signal'   => '<path d="M5 19v-3M9.7 19v-6M14.3 19v-9M19 19V6"/>',
		'globe'    => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
		'check'    => '<path d="M5 12.5l4.3 4.3L19 7.2"/>',
		'x'        => '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
		'alert'    => '<path d="M12 3.8 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17.2v.1"/>',
		'shield'   => '<path d="M12 3.2 19.5 6v5.8c0 4.4-3.1 7.9-7.5 9-4.4-1.1-7.5-4.6-7.5-9V6z"/><path d="M8.8 12.2l2.3 2.3 4.3-4.4"/>',
		'arrow'    => '<path d="M7 17 17 7M9 7h8v8"/>',
		'star'     => '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none"/>',
		'book'     => '<path d="M3 5.5c3-1.3 6-1.3 9 .5 3-1.8 6-1.8 9-.5V19c-3-1.3-6-1.3-9 .5-3-1.8-6-1.8-9-.5z"/><path d="M12 6v13.5"/>',
		'info'     => '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
	);
	if ( ! isset( $paths[ $name ] ) ) {
		return '';
	}
	return sprintf(
		'<svg class="icon %s" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>',
		esc_attr( $class ),
		$paths[ $name ]
	);
}

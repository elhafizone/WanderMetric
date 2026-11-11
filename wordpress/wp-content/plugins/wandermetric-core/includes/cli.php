<?php
/**
 * wp wandermetric import <dir> [--publish] [--dry-run] [--assets=<dir>] [--legacy-list=<file>]
 *
 * Thin WP-CLI wrapper around WM_Offer_Importer (importer.php).
 */

defined( 'ABSPATH' ) || exit;

WP_CLI::add_command(
	'wandermetric import',
	static function ( array $args, array $assoc ) {
		$importer = new WM_Offer_Importer(
			static function ( string $level, string $message ): void {
				if ( 'warning' === $level ) {
					WP_CLI::warning( $message );
				} elseif ( 'success' === $level ) {
					WP_CLI::success( $message );
				} else {
					WP_CLI::log( $message );
				}
			}
		);
		try {
			$importer->import( $args, $assoc );
		} catch ( RuntimeException $e ) {
			WP_CLI::error( $e->getMessage() );
		}
	},
	array(
		'shortdesc' => 'Import content/offers JSON files.',
		'synopsis'  => array(
			array( 'type' => 'positional', 'name' => 'dir', 'optional' => false ),
			array( 'type' => 'flag', 'name' => 'publish', 'optional' => true ),
			array( 'type' => 'flag', 'name' => 'dry-run', 'optional' => true ),
			array( 'type' => 'assoc', 'name' => 'assets', 'optional' => true ),
			array( 'type' => 'assoc', 'name' => 'legacy-list', 'optional' => true ),
		),
	)
);

<?php
/**
 * The offer importer. Reads content/offers/<programme>/<slug>.json (the same
 * files the Next.js importer read), idempotent on the slug, Markdown bodies to
 * HTML, partner images into the media library. Publishing goes through the
 * publish gate; failures stay drafts with their reasons logged.
 *
 * Used by WP-CLI (wp wandermetric import, cli.php) and by the background
 * bundle import on the server (bundle-import.php), so it never calls WP_CLI.
 */

defined( 'ABSPATH' ) || exit;

class WM_Offer_Importer {

	/** @var callable(string $level, string $message): void */
	private $logger;

	public function __construct( ?callable $logger = null ) {
		$this->logger = $logger ?: static function ( string $level, string $message ): void {
			error_log( 'wandermetric import [' . $level . '] ' . $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		};
	}

	private function log( string $level, string $message ): void {
		( $this->logger )( $level, $message );
	}

	private const REQUIRED = array( 'programme', 'section', 'title', 'slug', 'source_url', 'read_on', 'affiliate_url', 'facts', 'summary', 'body' );

	/**
	 * Import offer JSON files.
	 *
	 * ## OPTIONS
	 *
	 * <dir>
	 * : The content/offers directory, or one .json file.
	 *
	 * [--publish]
	 * : Try to publish each offer (the publish gate decides).
	 *
	 * [--dry-run]
	 * : Validate only; write nothing.
	 *
	 * [--assets=<dir>]
	 * : The Next.js public/ directory. Offers without partner images get
	 *   public/imagery/offers/<slug>.jpg|png, if present, sideloaded with its credit.
	 *
	 * [--legacy-list=<file>]
	 * : scripts/lib/visual-policy.mjs; slugs in LEGACY_OFFERS_WITHOUT_IMAGES are flagged legacy.
	 *
	 * @param string[] $args
	 * @param array<string, string|bool> $assoc
	 */
	public function import( array $args, array $assoc ): array {
		if ( ! class_exists( 'Parsedown' ) ) {
			throw new RuntimeException( 'Parsedown is missing. Run `composer install` in the wandermetric-core plugin folder.' );
		}
		$files   = $this->files( $args[0] );
		$publish = ! empty( $assoc['publish'] );
		$dry     = ! empty( $assoc['dry-run'] );
		$assets  = isset( $assoc['assets'] ) ? rtrim( (string) $assoc['assets'], '/\\' ) : '';
		$legacy  = isset( $assoc['legacy-list'] ) ? $this->legacy_slugs( (string) $assoc['legacy-list'] ) : array();
		$credits = $assets ? $this->credits( $assets . '/imagery/CREDITS.md' ) : array();
		$md      = new Parsedown();
		$md->setSafeMode( false ); // Our own authored files; HTML is sanitised by wp_kses_post below.

		$stats = array( 'created' => 0, 'updated' => 0, 'published' => 0, 'held' => 0 );

		foreach ( $files as $file ) {
			$offer = json_decode( (string) file_get_contents( $file ), true );
			$name  = basename( $file );
			$error = $this->validate( $offer, $name );
			if ( $error ) {
				$this->log( 'warning', $error );
				continue;
			}
			if ( $dry ) {
				$this->log( 'info', "ok  {$name}" );
				continue;
			}

			$facts  = $offer['facts'];
			$images = $facts['images'] ?? array();
			$credit = (string) ( $facts['image_credit'] ?? '' );
			unset( $facts['images'], $facts['image_credit'] );

			$existing = get_page_by_path( $offer['slug'], OBJECT, 'wm_offer' );
			$post_id  = wp_insert_post(
				array(
					'ID'           => $existing ? $existing->ID : 0,
					'post_type'    => 'wm_offer',
					'post_status'  => $existing ? $existing->post_status : 'draft',
					'post_title'   => $offer['title'],
					'post_name'    => $offer['slug'],
					'post_excerpt' => $offer['summary'],
					'post_content' => wp_kses_post( $md->text( $offer['body'] ) ),
				),
				true
			);
			if ( is_wp_error( $post_id ) ) {
				$this->log( 'warning', "{$name}: " . $post_id->get_error_message() );
				continue;
			}
			$stats[ $existing ? 'updated' : 'created' ]++;

			$place = $this->place_term( $offer );
			if ( ! $place ) {
				$this->log( 'warning', "{$name}: unknown place " . ( $offer['city'] ?? $offer['country'] ) . '; add it under Offers → Places.' );
			}
			wp_set_object_terms( $post_id, $offer['section'], 'wm_section' );
			wp_set_object_terms( $post_id, $place ? array( $place ) : array(), 'wm_place' );

			if ( $images ) {
				$images = $this->sideload_remote( $images, $post_id, $existing ? wm_offer_images( $post_id ) : array(), dirname( $file, 2 ) );
			} elseif ( $assets ) {
				[ $images, $credit ] = $this->sideload_local( $offer['slug'], $assets, $credits, $post_id, $credit );
			}

			$meta = array(
				'wm_programme'      => $offer['programme'],
				'wm_kind'           => $offer['kind'] ?? '',
				'wm_source_url'     => $offer['source_url'],
				'wm_read_on'        => $offer['read_on'],
				'wm_affiliate_url'  => $offer['affiliate_url'],
				'wm_price_note'     => $offer['price_note'] ?? '',
				'wm_tip'            => $offer['tip'] ?? '',
				'wm_facts'          => wp_json_encode( $facts, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
				'wm_images'         => wp_json_encode( array_values( $images ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
				'wm_image_credit'   => $credit,
				// The bundle import has no legacy list, so an offer already flagged keeps its flag.
				'wm_legacy_visuals' => ( ! $images && ( in_array( $offer['slug'], $legacy, true ) || ( $existing && get_post_meta( $existing->ID, 'wm_legacy_visuals', true ) ) ) ) ? '1' : '',
			);
			foreach ( $meta as $key => $value ) {
				update_post_meta( $post_id, $key, wp_slash( $value ) );
			}

			if ( $publish ) {
				$errors = wm_publish_gate_errors( $post_id );
				if ( $errors ) {
					$stats['held']++;
					$this->log( 'warning', "{$offer['slug']} kept as draft: " . implode( ' ', $errors ) );
				} else {
					wp_update_post( array( 'ID' => $post_id, 'post_status' => 'publish' ) );
					$stats['published']++;
				}
			}
		}

		$this->log( 'success', sprintf( '%d created, %d updated, %d published, %d held back by the gate.', $stats['created'], $stats['updated'], $stats['published'], $stats['held'] ) );
		return $stats;
	}

	/** @return string[] */
	private function files( string $path ): array {
		if ( is_file( $path ) ) {
			return array( $path );
		}
		if ( ! is_dir( $path ) ) {
			throw new RuntimeException( "Not found: {$path}" );
		}
		$files = glob( rtrim( $path, '/\\' ) . '/*/*.json' );
		sort( $files );
		return $files;
	}

	private function validate( $offer, string $name ): ?string {
		if ( ! is_array( $offer ) ) {
			return "{$name}: not valid JSON";
		}
		foreach ( self::REQUIRED as $key ) {
			if ( empty( $offer[ $key ] ) ) {
				return "{$name}: missing {$key}";
			}
		}
		if ( ! wm_is_section( (string) $offer['section'] ) ) {
			return "{$name}: unknown section {$offer['section']}";
		}
		if ( empty( $offer['city'] ) && empty( $offer['country'] ) ) {
			return "{$name}: needs a city or a country";
		}
		if ( ! preg_match( '#^https://#', (string) $offer['affiliate_url'] ) ) {
			return "{$name}: affiliate_url must be https";
		}
		return null;
	}

	private function place_term( array $offer ): ?int {
		$slug = $offer['city'] ?? $offer['country'];
		$term = get_term_by( 'slug', $slug, 'wm_place' );
		if ( ! $term instanceof WP_Term ) {
			return null;
		}
		// A "country" value must be a top-level term, a "city" a child.
		if ( isset( $offer['city'] ) ? 0 === (int) $term->parent : 0 !== (int) $term->parent ) {
			return null;
		}
		return (int) $term->term_id;
	}

	/** @return string[] */
	private function legacy_slugs( string $file ): array {
		$src = (string) file_get_contents( $file );
		if ( ! preg_match( '/LEGACY_OFFERS_WITHOUT_IMAGES\s*=\s*new Set\(\[(.*?)\]\)/s', $src, $m ) ) {
			$this->log( 'warning', 'LEGACY_OFFERS_WITHOUT_IMAGES not found in ' . $file );
			return array();
		}
		preg_match_all( '/"([a-z0-9-]+)"/', $m[1], $slugs );
		return $slugs[1];
	}

	/** @return array<string, string> file name → "Photographer (source URL)" from the credits table */
	private function credits( string $file ): array {
		$out = array();
		if ( ! is_file( $file ) ) {
			return $out;
		}
		foreach ( file( $file ) as $line ) {
			if ( preg_match( '/^\|\s*`offers\/([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*(\S+)\s*\|/', $line, $m ) ) {
				$out[ $m[1] ] = trim( $m[2] ) . ' (' . trim( $m[3] ) . ')';
			}
		}
		return $out;
	}

	/**
	 * Copy partner images into the media library so pages never hotlink a
	 * partner CDN (no visitor request reaches a third party before consent).
	 * Each image keeps its original URL in `source`; already-imported sources are reused.
	 *
	 * @param array<int, array{url: string, alt?: string}> $images
	 * @param array<int, array<string, string>>          $current
	 * @return array<int, array{url: string, alt: string, source: string, id: int}>
	 */
	private function sideload_remote( array $images, int $post_id, array $current, string $offers_dir = '' ): array {
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$known = array();
		foreach ( json_decode( (string) get_post_meta( $post_id, 'wm_images', true ), true ) ?: array() as $img ) {
			if ( ! empty( $img['source'] ) && ! empty( $img['id'] ) && get_post( (int) $img['id'] ) ) {
				$known[ $img['source'] ] = $img;
			}
		}
		$out = array();
		foreach ( array_slice( $images, 0, 4 ) as $img ) {
			$source = (string) $img['url'];
			$alt    = (string) ( $img['alt'] ?? '' );
			if ( isset( $known[ $source ] ) ) {
				$out[] = array_merge( $known[ $source ], array( 'alt' => $alt ) );
				continue;
			}
			// A copy downloaded beforehand (content/offers/_images, see README): the
			// partner's server refuses WordPress's downloader but serves the file.
			$local = ! empty( $img['file'] ) && $offers_dir ? $offers_dir . '/' . ltrim( (string) $img['file'], '/' ) : '';
			if ( $local && is_file( $local ) && 0 === strpos( realpath( $local ), realpath( $offers_dir ) ) ) {
				$tmp = wp_tempnam( basename( $local ) );
				copy( $local, $tmp );
			} else {
				$tmp = download_url( $source, 30 );
			}
			if ( is_wp_error( $tmp ) ) {
				$this->log( 'warning', "image not downloaded ({$source}): " . $tmp->get_error_message() );
				continue;
			}
			$path = (string) wp_parse_url( $source, PHP_URL_PATH );
			$name = sanitize_file_name( basename( $path ) ?: 'offer-image' );
			if ( ! preg_match( '/\.(jpe?g|png|webp|gif)$/i', $name ) ) {
				$type = wp_get_image_mime( $tmp );
				$name .= 'image/png' === $type ? '.png' : ( 'image/webp' === $type ? '.webp' : '.jpg' );
			}
			$id = media_handle_sideload( array( 'name' => $name, 'tmp_name' => $tmp ), $post_id, $alt );
			if ( is_wp_error( $id ) ) {
				wp_delete_file( $tmp );
				$this->log( 'warning', "image not imported ({$source}): " . $id->get_error_message() );
				continue;
			}
			update_post_meta( $id, '_wp_attachment_image_alt', $alt );
			$out[] = array(
				'url'    => (string) wp_get_attachment_url( $id ),
				'alt'    => $alt,
				'source' => $source,
				'id'     => (int) $id,
			);
		}
		return $out;
	}

	/** @return array{0: array<int, array{url: string, alt: string}>, 1: string} */
	private function sideload_local( string $slug, string $assets, array $credits, int $post_id, string $credit ): array {
		foreach ( array( 'jpg', 'png', 'webp' ) as $ext ) {
			$file = "{$assets}/imagery/offers/{$slug}.{$ext}";
			if ( ! is_file( $file ) || ! isset( $credits[ "{$slug}.{$ext}" ] ) ) {
				continue;
			}
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
			$tmp = wp_tempnam( $file );
			copy( $file, $tmp );
			$id = media_handle_sideload( array( 'name' => basename( $file ), 'tmp_name' => $tmp ), $post_id );
			if ( is_wp_error( $id ) ) {
				$this->log( 'warning', "{$slug}: image not imported: " . $id->get_error_message() );
				return array( array(), $credit );
			}
			return array( array( array( 'url' => (string) wp_get_attachment_url( $id ), 'alt' => get_the_title( $post_id ), 'source' => "local:{$slug}.{$ext}", 'id' => (int) $id ) ), $credits[ "{$slug}.{$ext}" ] );
		}
		return array( array(), $credit );
	}
}



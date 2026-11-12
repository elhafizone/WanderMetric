<?php
/**
 * Guides: answer-first articles for the questions people ask before they book
 * ("Is the Lisboa Card worth it?", "Rome airport to the city"). They are the
 * pages search engines send readers to; offers are what those readers book.
 *
 *   /guides/            every guide (theme: wm-guides.php)
 *   /guides/{slug}/     one guide (theme: single-wm_guide.php)
 *
 * The same rule as offers holds: every figure a guide states comes from a
 * source it lists with the date that source was read (official operator and
 * tourism-board pages, or our own dated offer pages). Nothing is estimated.
 *
 * Authored as content/guides/<slug>.json. `wordpress/bundle-offers.sh` copies
 * them into data/guides/ with a .bundle hash; the first request that sees a
 * new hash imports the new or changed files and publishes each one through
 * wm_guide_gate_errors(). A guide that fails the gate stays a draft.
 */

defined( 'ABSPATH' ) || exit;

/** Visible characters of original text a guide needs before it can go live. */
const WM_GUIDE_MIN_CHARS = 3000;
/** Sources a guide must cite, each with the date it was read. */
const WM_GUIDE_MIN_SOURCES = 2;

add_action(
	'init',
	static function () {
		register_post_type(
			'wm_guide',
			array(
				'labels'          => array(
					'name'          => __( 'Guides', 'wandermetric' ),
					'singular_name' => __( 'Guide', 'wandermetric' ),
					'add_new_item'  => __( 'Add guide', 'wandermetric' ),
					'edit_item'     => __( 'Edit guide', 'wandermetric' ),
					'all_items'     => __( 'All guides', 'wandermetric' ),
				),
				'public'          => true,
				'has_archive'     => false,
				'rewrite'         => false,
				'query_var'       => 'wm_guide',
				'show_in_rest'    => true,
				'menu_icon'       => 'dashicons-book-alt',
				'menu_position'   => 6,
				'supports'        => array( 'title', 'editor', 'excerpt', 'revisions', 'custom-fields' ),
				'capability_type' => 'post',
			)
		);
	},
	5
);

add_action(
	'init',
	static function () {
		add_rewrite_rule( '^guides/([a-z0-9-]+)/?$', 'index.php?post_type=wm_guide&wm_guide=$matches[1]&wm_route=guide', 'top' );
		add_rewrite_rule( '^guides/?$', 'index.php?wm_route=guides', 'top' );
	},
	20
);

add_filter(
	'post_type_link',
	static function ( string $link, WP_Post $post ) {
		return 'wm_guide' === $post->post_type && $post->post_name
			? home_url( user_trailingslashit( 'guides/' . $post->post_name ) )
			: $link;
	},
	10,
	2
);

function wm_guides_url(): string {
	return home_url( user_trailingslashit( 'guides' ) );
}

/* ---------- Reading a guide ---------- */

/** @return array<int, array{name: string, url: string, read_on: string}> */
function wm_guide_sources( int $post_id ): array {
	$list = json_decode( (string) get_post_meta( $post_id, 'wm_sources', true ), true );
	if ( ! is_array( $list ) ) {
		return array();
	}
	$out = array();
	foreach ( $list as $s ) {
		if ( is_array( $s ) && ! empty( $s['url'] ) ) {
			$out[] = array(
				'name'    => (string) ( $s['name'] ?? $s['url'] ),
				'url'     => (string) $s['url'],
				'read_on' => (string) ( $s['read_on'] ?? '' ),
			);
		}
	}
	return $out;
}

/** @return string[] offer slugs, in the order the guide lists them */
function wm_guide_offer_slugs( int $post_id ): array {
	$list = json_decode( (string) get_post_meta( $post_id, 'wm_offers', true ), true );
	return is_array( $list ) ? array_values( array_filter( array_map( 'strval', $list ) ) ) : array();
}

/** The published offers a guide points at, in its order. @return WP_Post[] */
function wm_guide_offers( int $post_id ): array {
	$out = array();
	foreach ( wm_guide_offer_slugs( $post_id ) as $slug ) {
		$offer = get_page_by_path( $slug, OBJECT, 'wm_offer' );
		if ( $offer && 'publish' === $offer->post_status ) {
			$out[] = $offer;
		}
	}
	return $out;
}

/** @return array{country: ?WP_Term, city: ?WP_Term} */
function wm_guide_place( int $post_id ): array {
	$country = wm_get_country( (string) get_post_meta( $post_id, 'wm_country', true ) );
	$city    = $country ? wm_get_city( $country->slug, (string) get_post_meta( $post_id, 'wm_city', true ) ) : null;
	return array(
		'country' => $country,
		'city'    => $city,
	);
}

/** The guide's short answer, shown before the article. */
function wm_guide_answer( int $post_id ): string {
	return trim( (string) get_post_meta( $post_id, 'wm_answer', true ) );
}

/** The day the guide's facts were last checked against its sources (YYYY-MM-DD). */
function wm_guide_checked_on( int $post_id ): string {
	return (string) get_post_meta( $post_id, 'wm_checked_on', true );
}

/**
 * Published guides, newest first, optionally only those that link one offer
 * or sit in one country. The set is small, so it is filtered in PHP.
 *
 * @param array{offer?: string, country?: string, exclude?: int} $filter
 * @return WP_Post[]
 */
function wm_get_guides( array $filter = array() ): array {
	static $all = null;
	if ( null === $all ) {
		$all = get_posts(
			array(
				'post_type'      => 'wm_guide',
				'post_status'    => 'publish',
				'posts_per_page' => 200,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);
	}
	return array_values(
		array_filter(
			$all,
			static function ( WP_Post $g ) use ( $filter ) {
				if ( ! empty( $filter['exclude'] ) && (int) $filter['exclude'] === $g->ID ) {
					return false;
				}
				if ( ! empty( $filter['offer'] ) && ! in_array( $filter['offer'], wm_guide_offer_slugs( $g->ID ), true ) ) {
					return false;
				}
				if ( ! empty( $filter['country'] ) && get_post_meta( $g->ID, 'wm_country', true ) !== $filter['country'] ) {
					return false;
				}
				return true;
			}
		)
	);
}

/* ---------- The publish gate ---------- */

/** @return string[] reasons the guide cannot be published; empty means it passes. */
function wm_guide_gate_errors( int $post_id ): array {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return array( 'Guide not found.' );
	}
	$errors = array();
	$chars  = mb_strlen( trim( wp_strip_all_tags( $post->post_content ) ) );
	if ( $chars < WM_GUIDE_MIN_CHARS ) {
		$errors[] = sprintf( 'The text is %d characters; a guide needs at least %d.', $chars, WM_GUIDE_MIN_CHARS );
	}
	if ( '' === wm_guide_answer( $post_id ) ) {
		$errors[] = 'Write the short answer.';
	}
	if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', wm_guide_checked_on( $post_id ) ) ) {
		$errors[] = 'Add the date the facts were checked (YYYY-MM-DD).';
	}
	if ( ! wm_is_section( (string) get_post_meta( $post_id, 'wm_section', true ) ) ) {
		$errors[] = 'Choose one of the ten sections.';
	}
	if ( ! wm_guide_place( $post_id )['country'] ) {
		$errors[] = 'Choose a country (and a city if the guide is about one).';
	}
	$sources = wm_guide_sources( $post_id );
	if ( count( $sources ) < WM_GUIDE_MIN_SOURCES ) {
		$errors[] = sprintf( 'Cite at least %d sources.', WM_GUIDE_MIN_SOURCES );
	}
	foreach ( $sources as $s ) {
		if ( ! preg_match( '#^https://#', $s['url'] ) || ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $s['read_on'] ) ) {
			$errors[] = sprintf( 'Source "%s" needs an https:// address and the date it was read.', $s['name'] );
		}
	}
	$slugs = wm_guide_offer_slugs( $post_id );
	if ( ! $slugs ) {
		$errors[] = 'Link at least one offer the guide covers.';
	}
	foreach ( $slugs as $slug ) {
		$offer = get_page_by_path( $slug, OBJECT, 'wm_offer' );
		if ( ! $offer || 'publish' !== $offer->post_status ) {
			$errors[] = sprintf( 'The offer "%s" is not published.', $slug );
		}
	}
	return $errors;
}

add_action(
	'wp_after_insert_post',
	static function ( int $post_id, WP_Post $post ) {
		if ( 'wm_guide' !== $post->post_type || 'publish' !== $post->post_status || wp_is_post_revision( $post_id ) ) {
			return;
		}
		$errors = wm_guide_gate_errors( $post_id );
		if ( ! $errors ) {
			delete_post_meta( $post_id, '_wm_gate_errors' );
			return;
		}
		update_post_meta( $post_id, '_wm_gate_errors', $errors );
		wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) ); // Re-enters with status draft and returns.
	},
	20,
	2
);

add_action(
	'admin_notices',
	static function () {
		$screen = get_current_screen();
		if ( ! $screen || 'wm_guide' !== $screen->post_type || empty( $_GET['post'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$errors = (array) get_post_meta( (int) $_GET['post'], '_wm_gate_errors', true ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! array_filter( $errors ) ) {
			return;
		}
		echo '<div class="notice notice-error"><p><strong>' . esc_html__( 'Not published. Fix these first:', 'wandermetric' ) . '</strong></p><ul>';
		foreach ( $errors as $e ) {
			echo '<li>' . esc_html( (string) $e ) . '</li>';
		}
		echo '</ul></div>';
	}
);

/* ---------- Import from the bundle ---------- */

function wm_guides_dir(): string {
	return WM_CORE_DIR . 'data/guides';
}

/**
 * Import one guide file and try to publish it.
 *
 * @return array{slug: string, status: string, errors: string[]}
 */
function wm_import_guide_file( string $file ): array {
	$g    = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
	$name = basename( $file );
	foreach ( array( 'slug', 'title', 'section', 'country', 'summary', 'answer', 'checked_on', 'sources', 'offers', 'body' ) as $key ) {
		if ( ! is_array( $g ) || empty( $g[ $key ] ) ) {
			return array( 'slug' => $name, 'status' => 'skipped', 'errors' => array( "missing {$key}" ) );
		}
	}
	if ( ! class_exists( 'Parsedown' ) ) {
		return array( 'slug' => $g['slug'], 'status' => 'skipped', 'errors' => array( 'Parsedown is missing' ) );
	}
	$md = new Parsedown();
	$md->setSafeMode( false ); // Our own authored files; the HTML is sanitised by wp_kses_post.

	$existing = get_page_by_path( $g['slug'], OBJECT, 'wm_guide' );
	$admins   = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );
	$post_id  = wp_insert_post(
		wp_slash(
			array(
				'ID'           => $existing ? $existing->ID : 0,
				'post_type'    => 'wm_guide',
				'post_status'  => $existing ? $existing->post_status : 'draft',
				'post_author'  => $existing ? (int) $existing->post_author : (int) ( $admins[0] ?? 0 ),
				'post_title'   => $g['title'],
				'post_name'    => $g['slug'],
				'post_excerpt' => $g['summary'],
				'post_content' => wp_kses_post( $md->text( $g['body'] ) ),
			)
		),
		true
	);
	if ( is_wp_error( $post_id ) ) {
		return array( 'slug' => $g['slug'], 'status' => 'error', 'errors' => array( $post_id->get_error_message() ) );
	}
	$meta = array(
		'wm_section'    => (string) $g['section'],
		'wm_country'    => (string) $g['country'],
		'wm_city'       => (string) ( $g['city'] ?? '' ),
		'wm_answer'     => (string) $g['answer'],
		'wm_checked_on' => (string) $g['checked_on'],
		'wm_sources'    => wp_json_encode( array_values( (array) $g['sources'] ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
		'wm_offers'     => wp_json_encode( array_values( (array) $g['offers'] ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
	);
	foreach ( $meta as $key => $value ) {
		update_post_meta( $post_id, $key, wp_slash( $value ) );
	}
	$errors = wm_guide_gate_errors( $post_id );
	if ( $errors ) {
		update_post_meta( $post_id, '_wm_gate_errors', $errors );
		wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
		return array( 'slug' => $g['slug'], 'status' => 'draft', 'errors' => $errors );
	}
	delete_post_meta( $post_id, '_wm_gate_errors' );
	if ( 'publish' !== get_post_status( $post_id ) ) {
		wp_update_post( array( 'ID' => $post_id, 'post_status' => 'publish' ) );
	}
	return array( 'slug' => $g['slug'], 'status' => 'published', 'errors' => array() );
}

add_action(
	'init',
	static function () {
		$f    = wm_guides_dir() . '/.bundle';
		$hash = is_file( $f ) ? trim( (string) file_get_contents( $f ) ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		if ( '' === $hash || get_option( 'wm_guides_bundle' ) === $hash ) {
			return;
		}
		// Recorded first, so a failure below cannot make every request retry.
		update_option( 'wm_guides_bundle', $hash, false );

		$seen = (array) get_option( 'wm_guides_files', array() );
		$log  = array();
		foreach ( glob( wm_guides_dir() . '/*.json' ) ?: array() as $file ) {
			$md5 = (string) md5_file( $file );
			if ( ( $seen[ basename( $file ) ] ?? '' ) === $md5 ) {
				continue;
			}
			$result = wm_import_guide_file( $file );
			$log[]  = $result;
			if ( 'published' === $result['status'] || 'draft' === $result['status'] ) {
				$seen[ basename( $file ) ] = $md5;
			}
		}
		update_option( 'wm_guides_files', $seen, false );
		update_option( 'wm_guides_log', array( 'at' => current_time( 'mysql', true ), 'files' => $log ), false );
		if ( $log ) {
			do_action( 'litespeed_purge_all' );
		}
	},
	42
);

<?php
/**
 * Everything in <head> that search engines and social apps read, from one
 * source: wm_current_seo(). Title, meta description, canonical, Open Graph,
 * Twitter Card and JSON-LD all agree because they come from the same array.
 *
 * Schema rules (the site's "never fabricate" rule applies here too):
 * - No price, rating or review markup. Ratings on our pages belong to the
 *   partner's site; Google does not allow third-party ratings as rich
 *   results, and a price in markup would go stale the day after it was read.
 * - An offer is an Article: what it is, honestly, a dated guide written from
 *   a partner listing, with that listing as isBasedOn.
 */

defined( 'ABSPATH' ) || exit;

/** Home page description, the same promise the home hero makes. */
const WM_HOME_DESCRIPTION = 'Tickets, transfers, eSIMs and car hire for the cities you’re going to. Every page names the partner listing it was read from, and the date.';

/**
 * @return array{title: string, description: string, canonical: string, image: ?array, type: string}
 */
function wm_current_seo(): array {
	static $seo = null;
	if ( null !== $seo ) {
		return $seo;
	}
	$site  = get_bloginfo( 'name' );
	$image = null;
	$type  = 'website';

	$route = wm_page_meta();
	if ( $route ) {
		$title       = $route['title'];
		$description = $route['description'];
		$canonical   = $route['canonical'];
		$slug        = (string) ( get_query_var( 'wm_city' ) ?: get_query_var( 'wm_country' ) );
		$image       = $slug ? wm_seo_place_image( $slug ) : null;
	} elseif ( is_front_page() ) {
		$title       = $site . ' – ' . get_bloginfo( 'description' );
		$description = WM_HOME_DESCRIPTION;
		$canonical   = home_url( '/' );
		$image       = wm_seo_place_image( 'home' );
	} elseif ( is_singular() ) {
		$post        = get_queried_object();
		$custom_t    = trim( (string) get_post_meta( $post->ID, 'wm_seo_title', true ) );
		$custom_d    = trim( (string) get_post_meta( $post->ID, 'wm_seo_description', true ) );
		$title       = $custom_t ?: get_the_title( $post );
		$description = $custom_d ?: wp_trim_words( wp_strip_all_tags( has_excerpt( $post ) ? get_the_excerpt( $post ) : $post->post_content ), 30, '…' );
		$canonical   = (string) get_permalink( $post );
		if ( 'wm_offer' === $post->post_type ) {
			$type   = 'article';
			$images = wm_offer_images( $post->ID );
			if ( $images && $images[0]['id'] ) {
				$src   = wp_get_attachment_image_src( $images[0]['id'], 'large' );
				$image = $src ? array( 'url' => $src[0], 'width' => (int) $src[1], 'height' => (int) $src[2], 'alt' => $images[0]['alt'] ) : null;
			}
			if ( ! $image ) {
				$place = wm_offer_place( $post->ID );
				$image = wm_seo_place_image( $place['city'] ? $place['city']->slug : ( $place['country'] ? $place['country']->slug : 'home' ) );
			}
		} elseif ( 'wm_guide' === $post->post_type ) {
			$type  = 'article';
			$place = wm_guide_place( $post->ID );
			$image = wm_seo_place_image( $place['city'] ? $place['city']->slug : ( $place['country'] ? $place['country']->slug : 'home' ) );
		} elseif ( 'post' === $post->post_type ) {
			$type = 'article';
		}
	} elseif ( is_home() ) {
		$title       = 'Travel news';
		$description = 'Dated reports on changes that affect a trip. Every story says when it was published and where the facts came from.';
		$canonical   = (string) get_permalink( (int) get_option( 'page_for_posts' ) );
	} elseif ( is_search() ) {
		$title       = sprintf( 'Results for “%s”', get_search_query() );
		$description = '';
		$canonical   = '';
	} else {
		$title       = wp_strip_all_tags( (string) get_the_archive_title() );
		$description = '';
		$canonical   = '';
	}

	$seo = array(
		'title'       => wm_plain( (string) $title ),
		'description' => wm_fit_description( wm_plain( (string) $description ) ),
		'canonical'   => (string) $canonical,
		'image'       => $image ?: wm_seo_place_image( 'home' ),
		'type'        => $type,
	);
	return $seo;
}

/** Plain text from a WordPress title (which is HTML-encoded, e.g. &#038;). */
function wm_plain( string $text ): string {
	return trim( wp_strip_all_tags( html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
}

/** Characters a search result shows of a title before cutting it. */
const WM_TITLE_MAX = 60;

/**
 * A <title> that fits a search result: "Title | Site" when that fits; the bare
 * title when only it fits; else the title cut at a natural break (":", " (",
 * " – ", " with ", " & ", ", "), keeping the site name if there is room; else at a
 * word. The H1 and the social titles keep the full text.
 */
function wm_fit_title( string $title, string $site ): string {
	$suffix = ' | ' . $site;
	if ( false !== stripos( $title, $site ) ) {
		return $title;
	}
	if ( mb_strlen( $title . $suffix ) <= WM_TITLE_MAX ) {
		return $title . $suffix;
	}
	if ( mb_strlen( $title ) <= WM_TITLE_MAX ) {
		return $title;
	}
	$breaks = array();
	foreach ( array( ': ', ' (', ' – ', ' — ', ' - ', ' with ', ' & ', ' + ', ', ' ) as $sep ) {
		$from = 0;
		while ( false !== ( $pos = mb_strpos( $title, $sep, $from ) ) ) {
			if ( $pos >= 15 ) {
				$breaks[] = $pos;
			}
			$from = $pos + 1;
		}
	}
	sort( $breaks );
	// The longest head that still carries the site name, then the longest head without it.
	foreach ( array( mb_strlen( $suffix ), 0 ) as $room ) {
		foreach ( array_reverse( $breaks ) as $pos ) {
			if ( $pos + $room <= WM_TITLE_MAX ) {
				return mb_substr( $title, 0, $pos ) . ( $room ? $suffix : '' );
			}
		}
	}
	return wm_cut_at_word( $title, WM_TITLE_MAX, '' );
}

/** A meta description of at most 160 characters, ending on a sentence where one fits. */
function wm_fit_description( string $text, int $max = 160 ): string {
	if ( mb_strlen( $text ) <= $max ) {
		return $text;
	}
	if ( preg_match( '/^(.{90,' . ( $max - 1 ) . '}[.!?])(?:\s|$)/us', $text, $m ) ) {
		return $m[1];
	}
	return wm_cut_at_word( $text, $max - 1, '…' );
}

/** Cut at the last space within $max characters, without a dangling joiner. */
function wm_cut_at_word( string $text, int $max, string $ellipsis ): string {
	if ( ! preg_match( '/^(.{1,' . $max . '})\s/us', $text, $m ) ) {
		return mb_substr( $text, 0, $max );
	}
	$cut = (string) preg_replace( '/(?:\s+(?:and|or|with|on|of|for|to|the|a|in|at|from|&))+$/iu', '', rtrim( $m[1] ) );
	return rtrim( $cut, " \t,;:–—-(&/" ) . $ellipsis;
}

/** A licensed place photo (theme imagery) as an OG image, or null. */
function wm_seo_place_image( string $slug ): ?array {
	if ( ! function_exists( 'wm_place_photo' ) ) {
		return null;
	}
	$p = wm_place_photo( $slug );
	return $p ? array( 'url' => $p['src'], 'width' => (int) $p['w'], 'height' => (int) $p['h'], 'alt' => $p['alt'] ) : null;
}

/* ---------- <title> ---------- */

add_filter(
	'pre_get_document_title',
	static function ( $title ) {
		// pre_get_document_title skips core's escaping, so escape here.
		if ( is_front_page() ) {
			return esc_html( wm_current_seo()['title'] );
		}
		$t = wm_current_seo()['title'];
		if ( ! $t ) {
			return $title;
		}
		// "About WanderMetric" needs no " | WanderMetric" after it; long titles are fitted.
		return esc_html( wm_fit_title( $t, get_bloginfo( 'name' ) ) );
	}
);

/* ---------- description, canonical, Open Graph, Twitter ---------- */

add_action(
	'wp_head',
	static function () {
		$seo  = wm_current_seo();
		$out  = array();
		$meta = static function ( string $attr, string $key, string $value ) use ( &$out ) {
			if ( '' !== $value ) {
				$out[] = sprintf( '<meta %s="%s" content="%s">', $attr, esc_attr( $key ), esc_attr( $value ) );
			}
		};

		$meta( 'name', 'description', $seo['description'] );
		// Singular pages (offers, pages, the static front page) get their canonical from core's
		// rel_canonical. Our routes (core's is removed in seo.php) and the news archive print theirs.
		if ( $seo['canonical'] && ( wm_is_listing_route() || is_home() ) ) {
			$out[] = sprintf( '<link rel="canonical" href="%s">', esc_url( $seo['canonical'] ) );
		}

		$meta( 'property', 'og:site_name', get_bloginfo( 'name' ) );
		$meta( 'property', 'og:locale', str_replace( '-', '_', get_bloginfo( 'language' ) ) );
		$meta( 'property', 'og:type', $seo['type'] );
		$meta( 'property', 'og:title', $seo['title'] );
		$meta( 'property', 'og:description', $seo['description'] );
		$meta( 'property', 'og:url', $seo['canonical'] );
		if ( $seo['image'] ) {
			$meta( 'property', 'og:image', $seo['image']['url'] );
			$meta( 'property', 'og:image:width', (string) $seo['image']['width'] );
			$meta( 'property', 'og:image:height', (string) $seo['image']['height'] );
			$meta( 'property', 'og:image:alt', $seo['image']['alt'] );
		}
		if ( 'article' === $seo['type'] && is_singular() ) {
			$post = get_queried_object();
			$meta( 'property', 'article:published_time', get_post_time( 'c', true, $post ) );
			$meta( 'property', 'article:modified_time', get_post_modified_time( 'c', true, $post ) );
		}
		$meta( 'name', 'twitter:card', $seo['image'] ? 'summary_large_image' : 'summary' );
		$meta( 'name', 'twitter:title', $seo['title'] );
		$meta( 'name', 'twitter:description', $seo['description'] );
		if ( $seo['image'] ) {
			$meta( 'name', 'twitter:image', $seo['image']['url'] );
		}

		echo implode( "\n", $out ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
		wm_print_schema( $seo );
	},
	1
);

/* ---------- JSON-LD ---------- */

function wm_print_schema( array $seo ): void {
	$home  = home_url( '/' );
	$org   = array(
		'@type' => 'Organization',
		'@id'   => $home . '#organization',
		'name'  => get_bloginfo( 'name' ),
		'url'   => $home,
		'logo'  => array(
			'@type'  => 'ImageObject',
			'url'    => get_template_directory_uri() . '/assets/img/brand/icon.png',
			'width'  => 512,
			'height' => 512,
		),
	);
	$graph = array();

	if ( is_front_page() ) {
		$graph[] = $org;
		$graph[] = array(
			'@type'           => 'WebSite',
			'@id'             => $home . '#website',
			'url'             => $home,
			'name'            => get_bloginfo( 'name' ),
			'description'     => $seo['description'],
			'publisher'       => array( '@id' => $home . '#organization' ),
			'inLanguage'      => get_bloginfo( 'language' ),
			'potentialAction' => array(
				'@type'       => 'SearchAction',
				'target'      => array(
					'@type'       => 'EntryPoint',
					'urlTemplate' => $home . '?s={search_term_string}',
				),
				'query-input' => 'required name=search_term_string',
			),
		);
	} elseif ( is_singular( array( 'wm_offer', 'wm_guide', 'post' ) ) ) {
		$post    = get_queried_object();
		$article = array(
			'@type'            => 'Article',
			'@id'              => $seo['canonical'] . '#article',
			'headline'         => mb_substr( wm_plain( get_the_title( $post ) ), 0, 110 ),
			'description'      => $seo['description'],
			'url'              => $seo['canonical'],
			'mainEntityOfPage' => $seo['canonical'],
			'datePublished'    => get_post_time( 'c', true, $post ),
			'dateModified'     => get_post_modified_time( 'c', true, $post ),
			'inLanguage'       => get_bloginfo( 'language' ),
			'author'           => array( '@id' => $home . '#organization' ),
			'publisher'        => array( '@id' => $home . '#organization' ),
		);
		if ( $seo['image'] ) {
			$article['image'] = array(
				'@type'  => 'ImageObject',
				'url'    => $seo['image']['url'],
				'width'  => $seo['image']['width'],
				'height' => $seo['image']['height'],
			);
		}
		if ( 'wm_guide' === $post->post_type ) {
			// The pages the guide's figures were read from.
			$article['citation'] = array_map(
				static fn( $s ) => array(
					'@type' => 'CreativeWork',
					'name'  => $s['name'],
					'url'   => $s['url'],
				),
				wm_guide_sources( $post->ID )
			);
			$place = wm_guide_place( $post->ID );
			if ( $place['country'] ) {
				$article['contentLocation'] = array(
					'@type' => 'Place',
					'name'  => $place['city'] ? $place['city']->name . ', ' . $place['country']->name : $place['country']->name,
				);
			}
		}
		if ( 'wm_offer' === $post->post_type ) {
			$source = (string) get_post_meta( $post->ID, 'wm_source_url', true );
			if ( $source ) {
				$article['isBasedOn'] = $source; // The partner listing this guide was written from.
			}
			$place = wm_offer_place( $post->ID );
			if ( $place['city'] || $place['country'] ) {
				$article['contentLocation'] = array(
					'@type' => 'Place',
					'name'  => wm_offer_place_label_plain( $place ),
				);
			}
		}
		$graph[] = $article;
		$graph[] = $org;
	} elseif ( wm_is_listing_route() ) {
		$items = wm_route_offers_for_schema();
		if ( $items ) {
			$graph[] = array(
				'@type'           => 'CollectionPage',
				'@id'             => $seo['canonical'] . '#page',
				'url'             => $seo['canonical'],
				'name'            => $seo['title'],
				'description'     => $seo['description'],
				'isPartOf'        => array( '@id' => $home . '#website' ),
				'mainEntity'      => array(
					'@type'           => 'ItemList',
					'numberOfItems'   => count( $items ),
					'itemListElement' => array_map(
						static fn( $o, $i ) => array(
							'@type'    => 'ListItem',
							'position' => $i + 1,
							'url'      => get_permalink( $o ),
							'name'     => wm_plain( get_the_title( $o ) ),
						),
						$items,
						array_keys( $items )
					),
				),
			);
		}
	}

	if ( $graph ) {
		printf(
			"<script type=\"application/ld+json\">%s</script>\n",
			wp_json_encode(
				array(
					'@context' => 'https://schema.org',
					'@graph'   => $graph,
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG
			)
		);
	}
}

/** "Rome, Italy" from an offer place, without theme helpers. */
function wm_offer_place_label_plain( array $place ): string {
	if ( $place['city'] && $place['country'] ) {
		return $place['city']->name . ', ' . $place['country']->name;
	}
	return $place['country'] ? $place['country']->name : '';
}

/** The offers listed on the current route page, for ItemList. Max 30. */
function wm_route_offers_for_schema(): array {
	$route   = wm_route();
	$section = (string) get_query_var( 'wm_s' );
	$country = (string) get_query_var( 'wm_country' );
	$city    = (string) get_query_var( 'wm_city' );
	$filter  = array( 'limit' => 30 );
	switch ( $route ) {
		case 'section':
		case 'compare-section':
			$filter['section'] = $section;
			break;
		case 'section-country':
			$filter['section'] = $section;
			$filter['country'] = $country;
			break;
		case 'country':
			$filter['country'] = $country;
			break;
		case 'city':
			$filter['city'] = $city;
			break;
		default:
			return array();
	}
	return wm_get_offers( $filter );
}

/* ---------- SEO fields in the editor ---------- */

add_action(
	'init',
	static function () {
		foreach ( array( 'wm_offer', 'page', 'post' ) as $type ) {
			foreach ( array( 'wm_seo_title', 'wm_seo_description' ) as $key ) {
				register_post_meta(
					$type,
					$key,
					array(
						'type'              => 'string',
						'single'            => true,
						'show_in_rest'      => true,
						'sanitize_callback' => 'sanitize_text_field',
						'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ),
					)
				);
			}
		}
	}
);

add_action(
	'add_meta_boxes',
	static function () {
		add_meta_box( 'wm-seo', __( 'Search and sharing', 'wandermetric' ), 'wm_seo_meta_box', array( 'wm_offer', 'page', 'post' ), 'normal', 'low' );
	}
);

function wm_seo_meta_box( WP_Post $post ): void {
	wp_nonce_field( 'wm_seo_save', 'wm_seo_nonce' );
	$t = (string) get_post_meta( $post->ID, 'wm_seo_title', true );
	$d = (string) get_post_meta( $post->ID, 'wm_seo_description', true );
	?>
	<p><label for="wm_seo_title"><strong><?php esc_html_e( 'Title for Google and sharing', 'wandermetric' ); ?></strong></label><br>
	<input type="text" id="wm_seo_title" name="wm_seo_title" class="widefat" maxlength="70" value="<?php echo esc_attr( $t ); ?>" placeholder="<?php echo esc_attr( get_the_title( $post ) ); ?>">
	<span class="description"><?php esc_html_e( 'Optional. Leave empty to use the page title. About 60 characters show in Google.', 'wandermetric' ); ?></span></p>
	<p><label for="wm_seo_description"><strong><?php esc_html_e( 'Description', 'wandermetric' ); ?></strong></label><br>
	<textarea id="wm_seo_description" name="wm_seo_description" class="widefat" rows="3" maxlength="180" placeholder="<?php echo esc_attr( wp_trim_words( (string) $post->post_excerpt, 30, '…' ) ); ?>"><?php echo esc_textarea( $d ); ?></textarea>
	<span class="description"><?php esc_html_e( 'Optional. Leave empty to use the summary. About 155 characters show in Google.', 'wandermetric' ); ?></span></p>
	<?php
}

add_action(
	'save_post',
	static function ( int $post_id ) {
		if ( ! isset( $_POST['wm_seo_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['wm_seo_nonce'] ) ), 'wm_seo_save' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		foreach ( array( 'wm_seo_title', 'wm_seo_description' ) as $key ) {
			$value = isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : '';
			if ( '' === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}
	}
);

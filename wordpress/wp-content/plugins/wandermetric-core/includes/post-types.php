<?php
/**
 * The offer post type and its two taxonomies. Rewrites are off here: the
 * public URLs are /{section}/{country}/{slug}, built in routing.php.
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'wm_register_post_types', 5 );

function wm_register_post_types(): void {
	register_post_type(
		'wm_offer',
		array(
			'labels'          => array(
				'name'          => __( 'Offers', 'wandermetric' ),
				'singular_name' => __( 'Offer', 'wandermetric' ),
				'add_new_item'  => __( 'Add offer', 'wandermetric' ),
				'edit_item'     => __( 'Edit offer', 'wandermetric' ),
				'all_items'     => __( 'All offers', 'wandermetric' ),
			),
			'public'          => true,
			'has_archive'     => false,
			'rewrite'         => false,
			'query_var'       => 'wm_offer',
			'show_in_rest'    => true,
			'menu_icon'       => 'dashicons-location-alt',
			'menu_position'   => 5,
			'supports'        => array( 'title', 'editor', 'excerpt', 'revisions', 'custom-fields' ),
			'capability_type' => 'post',
		)
	);

	register_taxonomy(
		'wm_section',
		'wm_offer',
		array(
			'labels'            => array(
				'name'          => __( 'Sections', 'wandermetric' ),
				'singular_name' => __( 'Section', 'wandermetric' ),
			),
			'public'            => true,
			'hierarchical'      => false,
			'rewrite'           => false,
			'show_in_rest'      => true,
			'show_admin_column' => true,
			'meta_box_cb'       => false,
			// The list is fixed; only administrators may touch the terms at all.
			'capabilities'      => array(
				'manage_terms' => 'manage_options',
				'edit_terms'   => 'manage_options',
				'delete_terms' => 'do_not_allow',
				'assign_terms' => 'edit_posts',
			),
		)
	);

	register_taxonomy(
		'wm_place',
		'wm_offer',
		array(
			'labels'            => array(
				'name'          => __( 'Places', 'wandermetric' ),
				'singular_name' => __( 'Place', 'wandermetric' ),
				'parent_item'   => __( 'Country', 'wandermetric' ),
			),
			'public'            => true,
			'hierarchical'      => true,
			'rewrite'           => false,
			'show_in_rest'      => true,
			'show_admin_column' => true,
		)
	);
}

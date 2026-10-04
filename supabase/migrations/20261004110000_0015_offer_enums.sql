-- WanderMetric migration: 0015_offer_enums
--
-- The ten site sections mirror the Travelpayouts programme categories. The slug
-- is the section's URL segment, so the database cannot hold a section the site
-- has no page for.

create type offer_section as enum (
  'tours-activities',
  'hotels',
  'car-rentals',
  'flights',
  'trains-buses',
  'transfers',
  'package-tours',
  'insurance',
  'sim-cards',
  'travel-services'
);

alter type content_type add value if not exists 'offer';

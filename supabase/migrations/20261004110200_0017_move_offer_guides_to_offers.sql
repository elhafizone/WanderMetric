-- WanderMetric migration: 0017_move_offer_guides_to_offers
--
-- Moves the pilot offer guides from `activities` into `offers`. The legacy
-- editorial tables (guides, deals, activities, hotels, flight_routes) are left
-- untouched in the database; the site simply no longer reads them.

insert into offers (section, country_id, city_id, program_id, affiliate_link_id, name, slug, summary, body, facts,
                    facts_read_on, source_url, price_note, duration_minutes, status, published_at)
select 'tours-activities', c.country_id, a.city_id, a.program_id, a.affiliate_link_id, a.name, a.slug, a.summary, a.body,
       a.facts, a.facts_read_on, a.source_url, a.price_note, a.duration_minutes, 'published', now()
from activities a
join cities c on c.id = a.city_id
where a.program_id is not null and a.deleted_at is null;

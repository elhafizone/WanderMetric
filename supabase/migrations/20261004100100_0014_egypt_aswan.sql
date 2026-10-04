-- WanderMetric migration: 0014_egypt_aswan
--
-- Reference geography so the first Abu Simbel offer guide has a city to belong
-- to. Summaries are short and factual; richer destination copy is a separate
-- editorial task.

insert into countries (iso2, iso3, name, slug, continent, currency_code, phone_code, capital, summary, status, published_at)
values ('EG', 'EGY', 'Egypt', 'egypt', 'africa', 'EGP', '+20', 'Cairo',
        'Country in north-east Africa on the Nile and the Red Sea.', 'published', now());

insert into cities (country_id, name, slug, latitude, longitude, timezone, summary, status, is_featured)
select c.id, 'Aswan', 'aswan', 24.0889, 32.8998, 'Africa/Cairo',
       'City on the Nile in southern Egypt, the usual starting point for day trips to Abu Simbel.', 'published', false
from countries c where c.slug = 'egypt';

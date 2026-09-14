-- WanderMetric development seed
--
-- Rules this seed follows, deliberately:
--   * Countries, cities, coordinates, timezones and IATA codes are real,
--     verifiable reference data.
--   * Destination and guide copy is factual and written for this project.
--   * NO fabricated prices, availability, ratings, reviews or commissions.
--   * NO invented hotel businesses are published. The two hotel rows exist to
--     exercise admin CRUD and are seeded as `draft` with a [SAMPLE] prefix, so
--     RLS keeps them off the public site entirely.
--   * Activities are real, well-known public attractions described factually.
--   * The Travelpayouts provider is seeded `paused` because no credentials
--     exist; nothing can resolve through it until a marker is configured.
--
-- Idempotent: safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- Site settings
-- ---------------------------------------------------------------------------
insert into site_settings (key, value, description, is_public) values
  ('site.tagline', '"Travel discovery, measured."'::jsonb, 'Shown in the masthead', true),
  ('site.affiliate_disclosure',
   '"WanderMetric earns commission from some links on this site. This never affects which places we recommend or what we say about them."'::jsonb,
   'Required disclosure text shown wherever affiliate links appear', true),
  ('social.twitter', '"@wandermetric"'::jsonb, 'X/Twitter handle', true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Countries (real ISO 3166 data)
-- ---------------------------------------------------------------------------
insert into countries (iso2, iso3, name, slug, continent, currency_code, capital, summary, body, status, published_at) values
  ('FR', 'FRA', 'France', 'france', 'europe', 'EUR', 'Paris',
   'From Alpine passes to Atlantic surf towns, France packs an unusual range of landscapes and cuisines into a single, very walkable country.',
   'France rewards travellers who slow down. The country is compact enough to cross by train in an afternoon, yet each region keeps its own cooking, dialect and rhythm. The north brings butter, cider and long beaches; the south-west brings duck, Armagnac and the Pyrenees; Provence brings olive oil and light that drew painters for a century. Rail is the practical way to move: the TGV network links Paris to Lyon, Marseille, Bordeaux and Strasbourg in a few hours, and regional TER services reach almost every town worth stopping in. Peak season runs July and August, when much of the country takes its own holiday and the coast fills up. Late spring and September are quieter, warmer than most visitors expect, and considerably cheaper.',
   'published', now()),

  ('IT', 'ITA', 'Italy', 'italy', 'europe', 'EUR', 'Rome',
   'Three thousand years of layered history, and a food culture that changes meaningfully every eighty kilometres.',
   'Italy is less a single destination than twenty regions that happen to share a passport. Rome carries the weight of antiquity and the papacy; Florence and Siena hold the Renaissance; Naples is denser, louder and arguably eats better than either. The north — Milan, the lakes, the Dolomites — feels closer to Switzerland than to Sicily, which is closer in spirit to North Africa. Trains connect the major cities efficiently, though the further south you go the more patience the timetable asks for. Cities are busiest between June and August, when heat in Rome and Florence becomes genuinely punishing. April, May, September and October are the reliable months. Many museums close on Mondays, and a great deal closes entirely in mid-August.',
   'published', now()),

  ('ES', 'ESP', 'Spain', 'spain', 'europe', 'EUR', 'Madrid',
   'Late dinners, distinct regional languages, and a rail network that makes a multi-city trip genuinely easy.',
   'Spain runs on its own clock. Lunch rarely starts before two, dinner rarely before nine, and planning around that makes a trip considerably more pleasant. The regions differ more than most visitors expect: Catalonia and the Basque Country have their own languages and separate culinary traditions, Andalusia carries eight centuries of Moorish history in its architecture, and Galicia in the north-west is green, Atlantic and nothing like the popular image of the country. High-speed AVE trains link Madrid to Barcelona, Seville, Valencia and Málaga quickly and reliably. Inland summers are severe — Seville and Córdoba routinely pass forty degrees — so the shoulder seasons are not merely cheaper but more comfortable.',
   'published', now()),

  ('JP', 'JPN', 'Japan', 'japan', 'asia', 'JPY', 'Tokyo',
   'Exceptional public transport, deep seasonal traditions, and a country that rewards planning more than improvisation.',
   'Japan is one of the easiest countries in the world to travel and one of the hardest to improvise in. Trains run to the second, but popular ryokan, seasonal restaurants and cherry-blossom accommodation are booked months ahead. The Shinkansen network makes Tokyo, Kyoto, Osaka and Hiroshima a comfortable single itinerary. Seasons are taken seriously and shape what is worth seeing: cherry blossom moves north through late March and April, autumn colour moves south through November, and both draw significant domestic crowds. Summer is hot and humid across most of the country. An IC card handles local transport in every major city, and cash remains useful in smaller towns and at shrines despite widespread card acceptance elsewhere.',
   'published', now()),

  ('PT', 'PRT', 'Portugal', 'portugal', 'europe', 'EUR', 'Lisbon',
   'Atlantic light, a long coastline, and one of Western Europe''s more affordable capitals.',
   'Portugal is small enough to see properly in two weeks and varied enough to justify longer. Lisbon and Porto anchor the country at either end of a three-hour train line, with the Douro valley, the walled town of Óbidos and the university city of Coimbra in between. The Algarve draws the summer crowds to its cliffs and beaches; the Alentejo immediately inland stays quiet, hot and agricultural. The Atlantic keeps coastal temperatures moderate even in August, and the sea is genuinely cold year-round. Portugal remains noticeably cheaper than Spain, France or Italy for food and accommodation, though Lisbon has closed much of that gap in recent years.',
   'published', now())
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Cities (real coordinates, timezones and IATA city codes)
-- ---------------------------------------------------------------------------
insert into cities (country_id, name, slug, latitude, longitude, timezone, population, iata_code, summary, status, is_featured)
select c.id, v.name, v.slug, v.lat, v.lng, v.tz, v.pop, v.iata, v.summary, 'published', v.featured
from (values
  ('FR', 'Paris',     'paris',     48.856613,   2.352222, 'Europe/Paris',     2102650, 'PAR', 'Dense, walkable and best seen on foot between métro hops.', true),
  ('FR', 'Lyon',      'lyon',      45.764043,   4.835659, 'Europe/Paris',      522969, 'LYS', 'France''s gastronomic capital, at the meeting of two rivers.', false),
  ('FR', 'Nice',      'nice',      43.710173,   7.261953, 'Europe/Paris',      342669, 'NCE', 'Mediterranean light, a long promenade and the Alps an hour inland.', false),
  ('IT', 'Rome',      'rome',      41.902782,  12.496366, 'Europe/Rome',      2748109, 'ROM', 'Antiquity, baroque and espresso, layered on top of each other.', true),
  ('IT', 'Florence',  'florence',  43.769562,  11.255814, 'Europe/Rome',       367150, 'FLR', 'The Renaissance concentrated into a few walkable square kilometres.', false),
  ('IT', 'Naples',    'naples',    40.851775,  14.268124, 'Europe/Rome',       913462, 'NAP', 'Loud, dense, and the birthplace of pizza as anyone knows it.', false),
  ('ES', 'Barcelona', 'barcelona', 41.385064,   2.173404, 'Europe/Madrid',    1620343, 'BCN', 'Modernista architecture, a working port and a city beach.', true),
  ('ES', 'Madrid',    'madrid',    40.416775,  -3.703790, 'Europe/Madrid',    3223334, 'MAD', 'Spain''s high, dry capital, with three world-class art museums.', false),
  ('ES', 'Seville',   'seville',   37.389092,  -5.984459, 'Europe/Madrid',      688711, 'SVQ', 'Moorish architecture, orange trees and serious summer heat.', false),
  ('JP', 'Tokyo',     'tokyo',     35.689487, 139.691711, 'Asia/Tokyo',      13960000, 'TYO', 'Thirteen million people and the world''s best rail network.', true),
  ('JP', 'Kyoto',     'kyoto',     35.011564, 135.768149, 'Asia/Tokyo',       1464890, 'UKY', 'Sixteen hundred temples, and the old capital''s grid intact.', false),
  ('PT', 'Lisbon',    'lisbon',    38.722252,  -9.139337, 'Europe/Lisbon',     544851, 'LIS', 'Seven hills, Atlantic light and Europe''s oldest bookshop.', true),
  ('PT', 'Porto',     'porto',     41.157944,  -8.629105, 'Europe/Lisbon',     231962, 'OPO', 'Port wine lodges across the river from a granite old town.', false)
) as v(iso2, name, slug, lat, lng, tz, pop, iata, summary, featured)
join countries c on c.iso2 = v.iso2
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
insert into categories (name, slug, description, applies_to, sort_order) values
  ('City breaks',     'city-breaks',     'Short trips built around a single city', 'guide', 1),
  ('Food & drink',    'food-and-drink',  'Eating and drinking well while travelling', 'guide', 2),
  ('Itineraries',     'itineraries',     'Day-by-day routes', 'guide', 3),
  ('Budget travel',   'budget-travel',   'Travelling well for less', 'guide', 4),
  ('Museums & galleries', 'museums-galleries', 'Art and history', 'activity', 1),
  ('Landmarks',       'landmarks',       'Buildings and monuments worth the queue', 'activity', 2),
  ('Walking tours',   'walking-tours',   'Guided routes on foot', 'activity', 3)
on conflict do nothing;

insert into tags (name, slug) values
  ('Europe', 'europe'), ('Asia', 'asia'), ('First visit', 'first-visit'),
  ('Architecture', 'architecture'), ('Food', 'food'), ('Rail travel', 'rail-travel'),
  ('Shoulder season', 'shoulder-season')
on conflict do nothing;

commit;

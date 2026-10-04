import "server-only";

import {
  partnerLinksReady,
  travelpayoutsConfigFromEnv,
} from "@/core/affiliate/providers/travelpayouts";
import { listAvailablePartnerSearches, type PartnerSearch } from "@/core/affiliate/search";
import { listCities } from "@/core/content/queries";
import type { Db } from "@/core/shared/db";

/**
 * Everything the search module needs to render, in one place so every page that
 * carries it (home, flights, the category pages) agrees.
 *
 * A partner tab is offered only when its link row is live AND the redirector can
 * actually turn it into a tracked link. Offering a tab that ends in a 404 would
 * be worse than not offering it, so the second check reads the same environment
 * `/go` reads: the service-role key (it reads links with it) and the
 * Travelpayouts marker, token and project ID. Presence only; neither value is
 * used here.
 *
 * Airports are the cities we cover that have an IATA code, offered as
 * suggestions in the flights tab.
 */
export interface SearchModuleData {
  partners: PartnerSearch[];
  airports: { code: string; city: string }[];
}

function redirectorReady(): boolean {
  return (
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    partnerLinksReady(travelpayoutsConfigFromEnv())
  );
}

export async function loadSearchModuleData(db: Db): Promise<SearchModuleData> {
  const [searches, cities] = await Promise.all([
    listAvailablePartnerSearches(db),
    listCities(db, { perPage: 100 }),
  ]);

  return {
    partners: searches.ok && redirectorReady() ? searches.data : [],
    airports: cities.ok
      ? cities.data.items.flatMap((city) =>
          city.iata_code ? [{ code: city.iata_code, city: city.name }] : [],
        )
      : [],
  };
}

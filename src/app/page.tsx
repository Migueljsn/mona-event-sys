import { CatalogShell } from "@/components/public/catalog-shell";
import { getPublicCards, getSettings } from "@/lib/data/cards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, cards] = await Promise.all([getSettings(), getPublicCards()]);

  return <CatalogShell cards={cards} settings={settings} />;
}

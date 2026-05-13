import { buildPageMetadata } from "../../lib/siteMetadata";
import { getRequestLocale } from "../../lib/metadata";
import TrackOrderClient from "./TrackOrderClient";

type TrackPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TrackPageProps) {
  const [{ id }, locale] = await Promise.all([params, getRequestLocale()]);
  return buildPageMetadata("track", locale, encodeURIComponent(id));
}

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}

import PromoLanding from "./PromoLanding";
import { generateSurfaceMetadata } from "../lib/metadata";

export const generateMetadata = () => generateSurfaceMetadata("home", "promo");

export default function PromoPage() {
  return <PromoLanding />;
}

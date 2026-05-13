import LegalPage from "../components/LegalPage";
import { generateLocalizedMetadata } from "../lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("cookies");

export default function CookiesPage() {
  return <LegalPage pageId="cookies" />;
}

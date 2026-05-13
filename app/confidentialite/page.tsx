import LegalPage from "../components/LegalPage";
import { generateLocalizedMetadata } from "../lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("privacy");

export default function ConfidentialitePage() {
  return <LegalPage pageId="privacy" />;
}

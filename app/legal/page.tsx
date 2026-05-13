import LegalPage from "../components/LegalPage";
import { generateLocalizedMetadata } from "../lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("legalNotice");

export default function LegalAliasPage() {
  return <LegalPage pageId="legalNotice" />;
}

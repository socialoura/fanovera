import LegalPage from "../components/LegalPage";
import { generateLocalizedMetadata } from "../lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("terms");

export default function CgvPage() {
  return <LegalPage pageId="terms" />;
}

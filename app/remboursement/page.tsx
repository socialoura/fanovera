import LegalPage from "../components/LegalPage";
import { generateLocalizedMetadata } from "../lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("refund");

export default function RemboursementPage() {
  return <LegalPage pageId="refund" />;
}

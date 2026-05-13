import { generateLocalizedMetadata } from "../lib/metadata";
import OrderSuccessClient from "./OrderSuccessClient";

export const generateMetadata = () => generateLocalizedMetadata("orderSuccess");

export default function OrderSuccessPage() {
  return <OrderSuccessClient />;
}

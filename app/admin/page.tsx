import type { Metadata, Viewport } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Fanovera · Admin",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 1440,
  initialScale: 1,
};

export default function AdminPage() {
  return <AdminClient />;
}

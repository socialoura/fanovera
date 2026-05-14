import { Suspense } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getSessionEmail } from "../lib/accountAuth";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mon compte · Fanovera",
  description: "Accédez à vos commandes Fanovera et suivez la progression de chaque livraison.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const email = await getSessionEmail();

  return (
    <>
      <div className="paper-frame">
        <Header />
        <Suspense fallback={null}>
          <AccountClient initialEmail={email} />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}

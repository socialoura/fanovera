import en from "./en";
import type { LocaleDictionary } from "../types";

const tr: LocaleDictionary = {
  ...en,
  code: "tr",
  htmlLang: "tr",
  name: "Türkçe",
  selector: {
    label: "Dil",
    aria: "Dil seç",
    titleAuto: "Otomatik algılama",
    titleManual: "Manuel dil",
    menuTitle: "Dil",
    auto: "Auto",
    autoHint: "Ülkenize göre",
    autoMeta: "Auto",
    manualMeta: "Manuel",
    active: "Aktif"},
  status: {
    operational: "Tum hizmetler calisiyor",
    asOf: "tarih"},
  seo: {
    title: "Fanovera - Yapay zeka destekli çevrimiçi varlık",
    description:
      "Fanovera; denetim, strateji, içerik takvimi ve net takip ile çevrimiçi varlığınızı yapılandırmaya yardımcı olur."},
  css: {
    popular: "★ POPÜLER",
    bestValue: "✓ EN İYİ DEĞER"},
  exact: { ...en.exact, Suivi: "Takip", Commencer: "Başla", Produit: "Ürün", "Fonctionnement": "Nasıl çalışır", "Témoignages": "Yorumlar", "Société": "Şirket", Confidentialité: "Gizlilik", Continuer: "Devam et", Retour: "Geri", Payer: "Öde", "Commande confirmée": "Sipariş onaylandı", "Suivi de commande": "Sipariş takibi", "Retour à l'accueil": "Ana sayfaya dön", "Voir la solution": "Çözümü gör" },
  fragments: [
    ["Une presence en ligne", "Daha net bir çevrimiçi varlık"],
    ["Une présence en ligne", "Daha net bir çevrimiçi varlık"],
    ["plus claire", "daha net"],
    ["sans promesses artificielles", "yapay vaatler olmadan"],
    ["Une visibilité", "Görünürlük:"],
    ["Pack visibilité", "Görünürlük paketi"],
    ["crédit inclus", "dahil kredi"],
    ["Remise incluse", "İndirim dahil"],
    ["Quel profil souhaitez-vous promouvoir ?", "Hangi profili öne çıkarmak istiyorsunuz?"],
    ["Entrez votre pseudo", "Kullanıcı adınızı girin"],
    ["Aucun mot de passe", "Şifre yok"],
    ["aucun accès demandé", "erişim istenmez"],
    ["Le compte doit être public", "Hesap herkese açık olmalıdır"],
    ["Chargement du paiement sécurisé", "Güvenli ödeme yükleniyor"],
    ["Merci pour votre achat. Votre commande a bien été prise en compte.", "Satın alma işleminiz için teşekkürler. Siparişiniz alındı."]]};

export default tr;

import en from "./en";
import type { LocaleDictionary } from "../types";

const pt: LocaleDictionary = {
  ...en,
  code: "pt",
  htmlLang: "pt",
  name: "Português",
  selector: {
    label: "Idioma",
    aria: "Escolher idioma",
    titleAuto: "Detecção automática",
    titleManual: "Idioma manual",
    menuTitle: "Idioma",
    auto: "Auto",
    autoHint: "Com base no seu país",
    autoMeta: "Auto",
    manualMeta: "Manual",
    active: "Ativo"},
  status: {
    ordersThisWeek: "{count} pedidos entregues esta semana"},
  seo: {
    title: "Fanovera - Presença online assistida por IA",
    description:
      "A Fanovera ajuda a estruturar sua presença online com auditoria, estratégia, calendário de conteúdo e acompanhamento claro."},
  css: {
    popular: "★ POPULAR",
    bestValue: "✓ MELHOR VALOR"},
  exact: { ...en.exact, "Paiement sécurisé · SSL · via Stripe": "Pagamento seguro · SSL · via Stripe", Suivi: "Acompanhamento", Commencer: "Começar", Produit: "Produto", "Fonctionnement": "Como funciona", "Témoignages": "Avaliações", "Société": "Empresa", Confidentialité: "Privacidade", Continuer: "Continuar", Retour: "Voltar", Payer: "Pagar", "Commande confirmée": "Pedido confirmado", "Suivi de commande": "Acompanhamento do pedido", "Retour à l'accueil": "Voltar ao início", "Voir la solution": "Ver a solução" },
  fragments: [
    ["Une presence en ligne", "Uma presença online"],
    ["Une présence en ligne", "Uma presença online"],
    ["plus claire", "mais clara"],
    ["sans promesses artificielles", "sem promessas artificiais"],
    ["Une visibilité", "Visibilidade em"],
    ["Pack visibilité", "Pack de visibilidade"],
    ["crédit inclus", "crédito incluído"],
    ["Remise incluse", "Desconto incluído"],
    ["Quel profil souhaitez-vous promouvoir ?", "Qual perfil você quer promover?"],
    ["Entrez votre pseudo", "Digite seu usuário"],
    ["Aucun mot de passe", "Nenhuma senha"],
    ["aucun accès demandé", "nenhum acesso solicitado"],
    ["Le compte doit être public", "A conta precisa ser pública"],
    ["Chargement du paiement sécurisé", "Carregando pagamento seguro"],
    ["Merci pour votre achat. Votre commande a bien été prise en compte.", "Obrigado pela compra. Seu pedido foi recebido."]]};

export default pt;

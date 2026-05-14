# Audit i18n Fanovera — rapport automatique

Généré le 2026-05-13T20:43:25.892Z

## 1. Dictionnaire global `app/i18n/locales/*.ts`

| Locale | Fichier | `exact` | `fragments` | Total | Hérite de EN | Taille |
|---|---|---:|---:|---:|---|---:|
| fr | `app/i18n/locales/fr.ts` | 0 | 0 | 0 | ❌ | 870 o |
| en | `app/i18n/locales/en.ts` | 41 | 34 | 75 | ❌ | 4359 o |
| es | `app/i18n/locales/es.ts` | 36 | 34 | 70 | ✅ | 4328 o |
| pt | `app/i18n/locales/pt.ts` | 15 | 15 | 30 | ✅ | 2241 o |
| de | `app/i18n/locales/de.ts` | 15 | 15 | 30 | ✅ | 2231 o |
| it | `app/i18n/locales/it.ts` | 15 | 15 | 30 | ✅ | 2227 o |
| tr | `app/i18n/locales/tr.ts` | 15 | 15 | 30 | ✅ | 2225 o |

> Note : `fr` est la **source de vérité** (texte original dans les composants). Les autres locales fournissent un mapping `exact` (phrase→phrase) ou `fragments` (sub-string→sub-string) utilisé par `translateVisibleText()`. Plus le total est bas, plus le texte FR fuit côté client.

## 2. Per-file copy records

### `app/components/publicCopy.ts` · variable `PUBLIC_COPY`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

Source : **fr** · **146** clés de texte

| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |
|---|---|---:|---:|---:|---:|
| `en` | humain | 146 | 0 | 18 | 100% |
| `es` | machine | 0 | 0 | 0 | (machine) |
| `pt` | machine | 0 | 0 | 0 | (machine) |
| `de` | machine | 0 | 0 | 0 | (machine) |
| `it` | machine | 0 | 0 | 0 | (machine) |
| `tr` | machine | 0 | 0 | 0 | (machine) |

**Valeurs identiques à la source (BLOCKER si caractères français)** :

- **en** : 18 valeurs identiques à `fr` (exemples : `header.faq`, `header.contact`, `hero.stars[2].a`)

### `app/lib/email.ts` · variable `EMAIL_COPY`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

Source : **fr** · **20** clés de texte

| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |
|---|---|---:|---:|---:|---:|
| `en` | humain | 20 | 0 | 2 | 100% |
| `es` | humain | 20 | 0 | 2 | 100% |
| `pt` | humain | 20 | 0 | 2 | 100% |
| `de` | humain | 20 | 0 | 2 | 100% |
| `it` | humain | 20 | 0 | 2 | 100% |
| `tr` | humain | 20 | 0 | 2 | 100% |

**Valeurs identiques à la source (BLOCKER si caractères français)** :

- **en** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)
- **es** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)
- **pt** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)
- **de** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)
- **it** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)
- **tr** : 2 valeurs identiques à `fr` (exemples : `subject`, `heroBody`)

### `app/instagram/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\instagram\i18n.ts` — ⚠️ Variable not found

### `app/tiktok/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\tiktok\i18n.ts` — ⚠️ Variable not found

### `app/youtube/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\youtube\i18n.ts` — ⚠️ Variable not found

### `app/spotify/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\spotify\i18n.ts` — ⚠️ Variable not found

### `app/twitch/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\twitch\i18n.ts` — ⚠️ Variable not found

### `app/facebook/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\facebook\i18n.ts` — ⚠️ Variable not found

### `app/linkedin/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `app/linkedin/i18n.ts` · variable `copy`

Locales présentes : `fr`, `en`
Locales **absentes** (fallback runtime FR si pas géré) : `es`, `pt`, `de`, `it`, `tr`

Source : **fr** · **107** clés de texte

| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |
|---|---|---:|---:|---:|---:|
| `en` | humain | 107 | 0 | 4 | 100% |
| `es` | absent | 0 | 107 | 0 | 0% |
| `pt` | absent | 0 | 107 | 0 | 0% |
| `de` | absent | 0 | 107 | 0 | 0% |
| `it` | absent | 0 | 107 | 0 | 0% |
| `tr` | absent | 0 | 107 | 0 | 0% |

**Valeurs identiques à la source (BLOCKER si caractères français)** :

- **en** : 4 valeurs identiques à `fr` (exemples : `step1.audience`, `step1.total`, `footer.cookies`)

### `app/twitter/i18n.ts` · variable `localized`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

### `C:\Users\ilyee\Fanovera\app\twitter\i18n.ts` — ⚠️ Variable not found

### `app/contact/ContactClient.tsx` · variable `COPY`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

Source : **fr** · **56** clés de texte

| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |
|---|---|---:|---:|---:|---:|
| `en` | humain | 56 | 0 | 9 | 100% |
| `es` | humain | 56 | 0 | 9 | 100% |
| `pt` | humain | 56 | 0 | 10 | 100% |
| `de` | humain | 56 | 0 | 11 | 100% |
| `it` | humain | 56 | 0 | 9 | 100% |
| `tr` | humain | 56 | 0 | 10 | 100% |

**Valeurs identiques à la source (BLOCKER si caractères français)** :

- **en** : 9 valeurs identiques à `fr` (exemples : `badge`, `subjects[0].value`, `subjects[1].value`)
- **es** : 9 valeurs identiques à `fr` (exemples : `subjects[0].value`, `subjects[1].value`, `subjects[2].value`)
- **pt** : 10 valeurs identiques à `fr` (exemples : `subjects[0].value`, `subjects[1].value`, `subjects[2].value`)
- **de** : 11 valeurs identiques à `fr` (exemples : `subjects[0].value`, `subjects[1].value`, `subjects[2].value`)
- **it** : 9 valeurs identiques à `fr` (exemples : `subjects[0].value`, `subjects[1].value`, `subjects[2].value`)
- **tr** : 10 valeurs identiques à `fr` (exemples : `subjects[0].value`, `subjects[1].value`, `subjects[2].value`)

### `app/track/TrackLookupClient.tsx` · variable `COPY`

Locales présentes : `fr`, `en`, `es`, `pt`, `de`, `it`, `tr`
Locales **absentes** (fallback runtime FR si pas géré) : —

Source : **fr** · **41** clés de texte

| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |
|---|---|---:|---:|---:|---:|
| `en` | humain | 41 | 0 | 3 | 100% |
| `es` | humain | 41 | 0 | 2 | 100% |
| `pt` | humain | 41 | 0 | 2 | 100% |
| `de` | humain | 41 | 0 | 2 | 100% |
| `it` | humain | 41 | 0 | 2 | 100% |
| `tr` | humain | 41 | 0 | 2 | 100% |

**Valeurs identiques à la source (BLOCKER si caractères français)** :

- **en** : 3 valeurs identiques à `fr` (exemples : `found`, `order`, `date`)
- **es** : 2 valeurs identiques à `fr` (exemples : `found`, `order`)
- **pt** : 2 valeurs identiques à `fr` (exemples : `found`, `order`)
- **de** : 2 valeurs identiques à `fr` (exemples : `found`, `order`)
- **it** : 2 valeurs identiques à `fr` (exemples : `found`, `order`)
- **tr** : 2 valeurs identiques à `fr` (exemples : `found`, `order`)

## 3. Chaînes hardcodées dans le JSX (hors admin et i18n)

Total détecté : **4**

| Fichier | Occurrences | Exemples |
|---|---:|---|
| `app/tiktok/components/Step2Username.tsx` | 2 | _Format invalide. Lettres, chiffres, &quot;.&quot; et &quot;__ / _followers_ |
| `app/facebook/components/Step3Checkout.tsx` | 1 | _OK 3D Secure_ |
| `app/youtube/components/Step3Checkout.tsx` | 1 | _OK 3D Secure_ |

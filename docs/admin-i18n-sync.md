# Admin i18n Sync

L'admin contient une vue `i18n` qui détecte les entrées encore héritées de l'anglais dans les locales `es`, `pt`, `de`, `it` et `tr`.

## Variables

- `OPENAI_API_KEY`: clé serveur utilisée par `/api/admin/i18n-sync`.
- `OPENAI_TRANSLATION_MODEL`: optionnel. Par défaut: `gpt-4o-mini`.

## Fonctionnement

1. Le bouton `Analyser` compare `app/i18n/locales/en.ts` avec les fichiers cibles.
2. Le bouton `Traduire les clés manquantes` appelle OpenAI côté serveur.
3. Les traductions sont ajoutées aux objets `exact` et `fragments` des fichiers de locale.

La clé OpenAI n'est jamais envoyée au client.

Note: l'écriture dans les fichiers fonctionne dans un environnement où le filesystem est writable. Sur un déploiement serverless read-only, lance cet outil en local puis commit les fichiers modifiés.

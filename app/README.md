# Global Stay

Application web de découverte d’hébergements, de voitures et de biens immobiliers.

## Démarrer

Prérequis : Node.js 20.19+.

```powershell
cd app
npm install
npm run dev
```

Vite affiche ensuite l’adresse locale dans le terminal.

## Vérifications

```powershell
npm run lint
npm run build
```

## Socle de production

Le schéma Supabase prêt à exécuter se trouve dans [`../supabase/schema.sql`](../supabase/schema.sql). Il couvre les profils, annonces, médias, demandes, avis et notifications avec Row Level Security.

1. Créer un projet Supabase et exécuter `supabase/schema.sql` dans l’éditeur SQL.
2. Copier `.env.example` vers `.env.local` et renseigner l’URL et la clé anonyme Supabase côté navigateur.
3. Garder Stripe, PayPal, e-mail et WhatsApp côté serveur. Ne jamais exposer leurs secrets dans une variable `VITE_`.
4. Remplacer progressivement le stockage local par les tables Supabase et ajouter les webhooks de paiement avant d’ouvrir les réservations réelles.

## Parcours disponibles

- Explorer des annonces de démonstration dans plusieurs pays pour les hôtels, villas, voitures, restaurants, taxis, services, expériences, maisons et terrains.
- Filtrer par catégorie, destination, dates, voyageurs et budget; trier par prix.
- Ouvrir une page produit dédiée (`/annonce/{id}`) avec galerie photo, présentation du prestataire, équipements, emplacement, avis, règles et panneau de réservation.
- Enregistrer des favoris, profils, demandes, avis, décisions hôte et notifications dans le navigateur.
- Consulter les favoris sur `/favoris` et les demandes sur `/mes-demandes`, avec retour vers l’accueil.
- Utiliser l’espace hôte pour confirmer ou refuser les demandes créées sur cet appareil.
- Créer des demandes de séjour, réserver une table, un taxi ou une expérience, planifier un service à l’heure ou demander une visite immobilière, puis consulter l’historique et les reçus.
- Déposer une annonce, visible dans la démo avec le statut « À vérifier ».
- Joindre une vidéo MP4/WebM de 50 Mo maximum, la prévisualiser puis la lire dans la fiche de l’annonce.
- Choisir un moyen de règlement de démonstration, simuler l’étape de paiement et imprimer le reçu de demande.

Les annonces sont des exemples répartis entre plusieurs pays. Les prix sont affichés dans la devise locale annoncée (EUR, XOF, USD, GBP, AED, JPY, CAD ou IDR); aucun taux de change en direct n’est appliqué, et le filtre de budget compare uniquement les annonces dans la devise choisie. Les annonces ajoutées par le formulaire hôte sont des exemples en euros.

Les demandes, profils, décisions hôte, notifications, avis et annonces restent dans le navigateur tant que Supabase n’est pas branché. L’espace hôte permet de confirmer ou refuser une demande sur cet appareil. Les notifications sont internes à la démo; aucun e-mail ni message WhatsApp n’est envoyé. Les profils ne sont pas authentifiés et ne doivent pas contenir de vraies coordonnées.

Carte bancaire, PayPal et Mobile Money sont des options de simulation sans débit. Les reçus ne sont pas des confirmations de réservation. Les annonces déposées ne sont pas publiées en ligne et les documents ne sont pas vérifiés. Le stockage du navigateur n’est pas chiffré : utiliser des coordonnées et vidéos fictives pour tester. Les vidéos sont conservées dans IndexedDB sur cet appareil uniquement.

Avant une mise en production mondiale, connecter une API et une base de données, ajouter l’authentification et les rôles, les taux de change, les règles de disponibilité, la modération, la vérification des biens, ainsi que des prestataires de paiement et de notifications compatibles avec chaque marché.

Les photos et les polices sont chargées depuis Unsplash et Google Fonts.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {

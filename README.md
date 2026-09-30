# Global Stay

Plateforme mondiale de découverte et de réservation : logements, voitures, restaurants, taxis, services, expériences, maisons et terrains.

## Tester localement

Prérequis : Node.js 20.19+.

```powershell
git clone <URL_DU_DEPOT>
cd Globalstay\app
npm install
npm run dev
```

Ouvrir ensuite l’adresse affichée par Vite, généralement `http://localhost:5173/`.

## Vérifier le projet

```powershell
npm run lint
npm run build
```

La version actuelle est une démo front-end. Les données sont conservées localement dans le navigateur. Le socle Supabase de production se trouve dans [`supabase/schema.sql`](supabase/schema.sql) et la configuration exemple dans [`app/.env.example`](app/.env.example).

# Global Stay

Plateforme mondiale de découverte et de réservation : logements, voitures, restaurants, taxis, services, expériences, maisons et terrains.

## Tester localement

Prérequis : Node.js 20.19+.

```powershell
git clone https://github.com/juvenalkoudakpo7-sudo/Globalstay.git
cd Globalstay\app
npm install
npm run dev
```

Ouvrir ensuite l’adresse affichée par Vite, généralement `http://localhost:5173/`.

## Version publique GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement l’application après chaque push sur `main`.

Dans GitHub, ouvrir `Settings > Pages` et choisir `GitHub Actions` comme source si GitHub le demande. Après l’exécution du workflow, l’application sera disponible ici :

```text
https://juvenalkoudakpo7-sudo.github.io/Globalstay/
```

## Vérifier le projet

```powershell
cd app
npm run lint
npm run build
```

La version actuelle est une démo front-end. Les données sont conservées localement dans le navigateur. Le socle Supabase de production se trouve dans [`supabase/schema.sql`](supabase/schema.sql) et la configuration exemple dans [`app/.env.example`](app/.env.example).

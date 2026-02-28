# Simulateur locatif (MVP)

MVP SaaS en Next.js (App Router) + Supabase (Auth + DB) pour simuler un investissement locatif long terme en France.

## Setup
1. Copier `.env.local.example` vers `.env.local` et renseigner les valeurs Supabase.
2. Appliquer le schéma SQL dans `supabase/schema.sql` dans votre projet Supabase.
3. Installer les dépendances puis lancer le serveur :
   - `npm install`
   - `npm run dev`

## Notes
- Les montants sont stockés en centimes (integers) en base.
- Les calculs fiscaux sont indicatifs (LMNP micro-BIC ou réel simplifié).
- Le seed est disponible dans `supabase/seed.sql` (remplacer l'UUID utilisateur).

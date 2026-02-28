# Checklist de tests manuels

## Auth
- Ouvrir `/auth`, créer un compte avec un email valide.
- Se connecter avec le compte créé et vérifier la redirection vers `/dashboard`.
- Se déconnecter et vérifier le retour sur `/`.

## Création de simulation
- Aller sur `/simulations/new` et compléter les 3 étapes avec des valeurs réalistes.
- Vérifier que la soumission redirige vers `/simulations/{id}`.
- Vérifier que la simulation apparaît dans `/dashboard`.

## Calculs
- Contrôler que le coût total = prix + frais notaire + travaux + mobilier.
- Vérifier que la mensualité change en fonction du taux et de la durée.
- Vérifier que la vacance réduit bien les loyers annuels.
- Vérifier que le cash-flow après impôt change selon le régime (micro vs réel).

## RLS
- Se connecter avec un second utilisateur et vérifier qu'il ne voit pas les simulations du premier.

## Résultats
- Vérifier que la page `/simulations/{id}` affiche bien les valeurs clé (cash-flow, fiscalité).
- Vérifier que le disclaimer fiscal est affiché.

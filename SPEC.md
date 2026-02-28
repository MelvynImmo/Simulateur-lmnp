Simulateur d’investissement locatif (MVP)
1) Objectif du produit

Fournir un simulateur d’investissement locatif long terme permettant à un utilisateur de :

saisir un projet immobilier en moins de 5 minutes,

comprendre immédiatement la rentabilité et le cash-flow,

savoir si le projet est bon, moyen ou mauvais selon des règles simples.

Le simulateur est indicatif, pédagogique, et ne remplace pas un conseil fiscal ou financier.

2) Cible

Investisseurs immobiliers débutants à intermédiaires

France

Location meublée LMNP uniquement (MVP)

3) Périmètre fonctionnel (MVP)
Inclus

Achat immobilier + financement

Revenus locatifs

Charges récurrentes

Vacance locative

Fiscalité :

LMNP micro-BIC

LMNP réel simplifié

Amortissements simplifiés (optionnels)

Cash-flow avant / après impôt

Rentabilité brute et nette

Verdict automatique (good / medium / bad)

Sauvegarde des simulations

Exclu (hors MVP)

SCI / SARL / démembrement

Plus-value à la revente

TRI / VAN

Prélèvements sociaux

Multi-biens / portefeuille

API externes (taux, annonces, DPE…)

4) Conventions techniques (STRICTES)
4.1 Stockage & calculs

Tous les montants sont calculés et stockés en centimes

Tous les taux sont calculés et stockés en basis points (bps)

Exemples :

150 000 € → 15000000

4 % → 400

30 % → 3000

⚠️ Aucun calcul ne doit être fait en float euros côté backend.

4.2 Affichage utilisateur

Tous les montants sont affichés en euros

Tous les taux sont affichés en pourcentage (%)

La conversion centimes → euros est faite uniquement à l’affichage

👉 Règle absolue :

L’utilisateur voit des euros, le moteur calcule en centimes.

5) Définitions des calculs
5.1 Coût total du projet
coût total = prix d’achat
           + frais de notaire
           + travaux
           + mobilier

5.2 Financement

Crédit amortissable à mensualité constante

Assurance :

soit % annuel du capital emprunté

soit montant mensuel fixe

Mensualité totale :

mensualité totale = mensualité crédit + assurance mensuelle

5.3 Revenus locatifs

Loyer mensuel hors charges × 12 = loyers annuels bruts

Vacance locative (%) appliquée sur les loyers bruts

loyers nets = loyers bruts - vacance

5.4 Charges annuelles

Incluent :

charges non récupérables

taxe foncière

PNO

gestion locative (% des loyers nets)

Les charges récupérables sont neutres pour le cash-flow.

5.5 Cash-flow
cash-flow annuel avant impôt =
  loyers nets
- charges annuelles
- (mensualité totale × 12)

cash-flow mensuel = annuel / 12


Effort d’épargne mensuel :

max(0, -cash-flow mensuel)

6) Fiscalité (MVP)
6.1 Micro-BIC

Abattement forfaitaire : 50 %

Base imposable :

base = loyers nets × 50 %


Impôt estimé :

impôt = base × TMI


⚠️ Prélèvements sociaux exclus volontairement.

6.2 Réel simplifié

Charges déductibles :

charges annuelles

intérêts d’emprunt année 1 uniquement

amortissements (si activés)

Résultat fiscal :

résultat = loyers nets
         - charges
         - intérêts année 1
         - amortissements


Base imposable plancher à 0

Aucun déficit reporté (MVP)

6.3 Amortissements (simplifiés)

Mobilier : 5 ans (linéaire)

Travaux : 10 ans (linéaire)

Bien immobilier :

85 % du prix

sur 30 ans

⚠️ Approche pédagogique, non exhaustive.

7) Rentabilité
Rentabilité brute
rentabilité brute =
  loyers annuels bruts / coût total du projet

Rentabilité nette
rentabilité nette =
 (loyers nets - charges annuelles)
 / coût total du projet


⚠️ Le financement n’entre pas dans la rentabilité (séparation rendement / levier).

8) Verdict automatique
Règles

Basé uniquement sur le cash-flow mensuel après impôt :

good : ≥ 0 €

medium : entre -100 € et 0 €

bad : < -100 €

Texte explicatif

Le backend génère un verdict_explanation clair et court, par exemple :

“Projet autofinancé ou quasi autofinancé.”

“Léger effort d’épargne, intéressant selon ton objectif patrimonial.”

“Effort d’épargne important, rendement insuffisant.”

9) Sécurité & données

RLS activé sur toutes les tables

Un utilisateur ne peut lire / écrire que ses simulations

1 simulation = 1 input

1 simulation = 1 résultat par régime fiscal

10) Règles de modification

Toute modification des règles de calcul doit être explicitement signalée

Aucune règle métier ne peut être modifiée sans mise à jour de ce fichier

11) Disclaimer

Les résultats fournis sont des estimations indicatives.
Ils ne constituent ni un conseil fiscal, ni un conseil en investissement.

# Règles techniques – Encodage

- Tous les fichiers .ts / .tsx / .md doivent être encodés en UTF-8.
- Aucun caractère encodé ISO-8859-1 ou Windows-1252 n’est autorisé.
- Les accents doivent être écrits en UTF-8 standard (é, è, à, ç, …).
- Toute modification de texte doit préserver l’encodage UTF-8 existant.

Si un fichier contient des caractères invalides, il doit être nettoyé avant toute autre modification.

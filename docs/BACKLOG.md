# Sereno — Backlog produit

Backlog fonctionnel inspiré de Money Manager.  
**Pas de choix techniques ici** — uniquement features, écrans, parcours et règles métier.

---

## Légende des statuts

| Statut | Signification |
|--------|---------------|
| `[ ]` | À faire |
| `[~]` | En cours |
| `[x]` | **Terminé** |
| `[-]` | Reporté / hors scope actuel |

> **Convention :** quand une tâche est livrée, remplace `[ ]` ou `[~]` par `[x]`.

---

## Vue d’ensemble par phase

| Phase | Focus | Avancement |
|-------|--------|------------|
| **P1** | Cœur quotidien (dashboard, transactions, budgets, comptes) | **Terminé** |
| **P2** | Analyse & organisation (calendrier, stats, filtres, transferts) | **Terminé** |
| **P3** | Patrimoine & avancé (cartes, prêts, import/export, devises) | **Terminé** (MVP) |

---

## P1 — Cœur quotidien

### 1. Tableau de bord financier

**Écran : Accueil (`/`)**

#### Affichage
- [x] Solde total (comptes inclus)
- [x] Revenus du mois
- [x] Dépenses du mois
- [x] Solde restant du mois (revenus − dépenses)
- [x] Dépenses du jour
- [x] Dépenses de la semaine
- [x] État des budgets (aperçu, top 3 proches du seuil)
- [x] Comptes principaux (liste + soldes)
- [x] Dernières transactions (5 récentes)
- [x] Répartition des dépenses du mois (strates)

#### Actions rapides
- [x] Ajouter une dépense (raccourci `?type=expense`)
- [x] Ajouter un revenu (raccourci `?type=income`)
- [x] Transfert
- [x] Statistiques
- [x] Calendrier
- [x] Budgets (via navigation)
- [x] Activité (via navigation)

#### UX
- [x] État vide accueillant (pas de culpabilisation)
- [x] Météo intérieure (message calme selon situation)
- [x] Variante desktop (grille 2 colonnes + sidebar)

---

### 2. Gestion des transactions

**Écran : Activité (`/transactions`)**

#### CRUD
- [x] Lister les transactions
- [x] Créer une transaction
- [x] Modifier une transaction
- [x] Supprimer une transaction
- [x] Grouper par jour avec libellé date

#### Types
- [x] Dépense
- [x] Revenu
- [x] Transfert entre comptes

#### Champs transaction
- [x] Montant
- [x] Date
- [x] Compte
- [x] Catégorie
- [x] Sous-catégorie
- [x] Note
- [x] Couleur / marqueur visuel
- [x] Photo / reçu (UI)
- [x] Statut (brouillon / validée / annulée)

#### Liste & navigation
- [x] Filtrer par mois (sélecteur de mois)
- [x] Tri personnalisé
- [x] Filtres avancés combinés (type, compte, catégorie, montant, récurrence)
- [x] Recherche textuelle

#### Règles métier (backend)
- [x] Partie double : création via RPC équilibrée
- [x] Partie double : modification via RPC (réécriture des écritures)
- [x] Suppression en cascade des écritures comptables
- [x] Transfert exclu des dépenses/revenus/budgets

---

### 3. Ajout rapide revenus / dépenses

**Écran : Nouvelle transaction (`/transactions/nouvelle`)**

- [x] Choisir le type (dépense / revenu)
- [x] Saisir le montant
- [x] Sélectionner la catégorie (picker)
- [x] Sélectionner le compte
- [x] Ajouter une note
- [x] Joindre une photo
- [x] Enregistrer la transaction
- [x] Parcours ≤ 3 secondes (focus montant + catégories fréquentes + extras repliés)
- [x] Suggestion automatique catégorie (dernière utilisée + mot dans la note)
- [x] « Enregistrer et ajouter une autre »

---

### 7. Budgets

**Écran : Budgets (`/budgets`) — cloud only**

- [x] Budget mensuel par catégorie
- [x] Budget mensuel global (toutes catégories)
- [x] Montant déjà utilisé (calculé)
- [x] Montant restant / dépassement
- [x] Indicateur de progression (jauge)
- [x] Alerte visuelle dépassement (ambre, pas rouge)
- [x] Créer / modifier / supprimer un budget
- [x] Mise à jour automatique selon les dépenses
- [x] Alerte « proche du seuil » (80 %)
- [x] Alerte prédictive fin de mois
- [x] Copier le budget du mois précédent
- [x] Périodes flexibles (hebdo, trimestre, année)

---

### 8. Catégories et sous-catégories

**Écran : Catégories (`/categories`) — cloud only**

- [x] Catégories globales Sereno (revenus + dépenses)
- [x] Créer une catégorie perso
- [x] Modifier une catégorie perso
- [x] Supprimer une catégorie perso
- [x] Icône + couleur par catégorie
- [x] Réorganiser l’ordre d’affichage
- [x] Activer / désactiver les sous-catégories
- [x] Créer une sous-catégorie
- [x] Promouvoir sous-catégorie → catégorie principale
- [x] Réassignation à la suppression

---

### 9. Gestion des comptes

**Écran : Comptes (`/comptes`) — cloud only**

- [x] Créer un compte
- [x] Modifier un compte
- [x] Supprimer un compte
- [x] Consulter le solde (initial + transactions)
- [x] Historique via filtre Activité (lien compte)
- [x] Types : espèces, compte bancaire, épargne, carte de crédit
- [x] Masquer un compte
- [x] Exclure du total général
- [x] Réorganiser l’ordre
- [x] Regrouper par type (UI)
- [x] Types étendus : débit, investissement, assurance, prêt, découvert, immobilier, autre

---

### 13. Transactions récurrentes

**Écran : Récurrences (`/recurrences`) — cloud only**

- [x] Créer une règle (type, montant, fréquence, compte, catégorie)
- [x] Fréquences : hebdomadaire, mensuelle, annuelle
- [x] Modifier / supprimer une règle
- [x] Génération automatique (Edge Function + cron)
- [x] Idempotence (règle + date = une seule transaction)
- [x] Rattrapage des occurrences manquées
- [x] Écritures comptables via RPC core
- [x] Désactiver sans supprimer (toggle — champ `active` existe)
- [x] Date de fin
- [x] Aperçu des prochaines occurrences
- [x] Modifier une occurrence vs la règle entière

---

### 27. Navigation & espaces (structure)

- [x] Accueil
- [x] Activité (Transactions)
- [x] Calendrier
- [x] Statistiques
- [x] Budgets
- [x] Comptes
- [x] Catégories
- [x] Récurrences
- [x] Modèles / favoris
- [x] Réglages
- [x] Auth / compte (`/compte`)
- [x] Navigation mobile (barre basse)
- [x] Navigation desktop (sidebar)

---

### Hors ligne & sync

- [x] Mode invité (IndexedDB, zero config)
- [x] Compte cloud gratuit (Supabase sync)
- [x] Migration invité → cloud à l’inscription
- [x] ~~Upsell conversion (20 tx / 14 jours / feature cloud)~~ — retiré (juillet 2026) : app entièrement gratuite sans quotas
- [x] PWA (service worker prod)

---

## P2 — Analyse & organisation

### 4. Transfert entre comptes

**Écran : Nouveau transfert (`/transferts/nouveau`)**

- [x] Compte source
- [x] Compte destination (≠ source)
- [x] Montant, date, note optionnelle
- [x] Non comptabilisé en dépense/revenu
- [x] Non impacté sur les budgets
- [x] Affichage distinct dans l’historique
- [x] RPC / écritures comptables miroir

---

### 5. Calendrier des transactions

**Écran : Calendrier (`/calendrier`)**

- [x] Vue mois (grille)
- [x] Vue semaine
- [x] Vue jour (détail au tap)
- [x] Revenus / dépenses par jour (indicateurs)
- [x] Intensité visuelle jours chargés
- [x] Détail transactions au tap sur un jour
- [x] Navigation entre mois
- [x] Ajouter une transaction depuis une date
- [x] Transferts visibles mais exclus des totaux jour

---

### 6. Statistiques et graphiques

**Écran : Statistiques (`/statistiques`)**

- [x] Répartition dépenses par catégorie (strates — accueil + stats)
- [x] Répartition revenus par catégorie
- [x] Évolution dépenses dans le temps
- [x] Évolution revenus dans le time
- [x] Évolution du solde (cumulé mensuel)
- [x] Évolution patrimoine / actifs (soldes comptes ; vue `net_worth_daily` Supabase prête pour sync ledger)
- [x] Comparaison entre périodes (N vs N−1)
- [x] Top catégories les plus coûteuses
- [x] Comptes les plus utilisés
- [x] Filtres période + comptes
- [x] Tap segment → filtrer Activité

---

### 15. Favoris / modèles de transactions

**Écran : Modèles**

- [x] Enregistrer une transaction comme modèle
- [x] Réutiliser un modèle (saisie pré-remplie)
- [x] Modifier / supprimer un modèle
- [x] Épingler en favori (grille saisie rapide)

---

### 16. Filtres avancés

**Panneau filtres (Activité + Export)**

- [x] Période (date début / fin)
- [x] Type (dépense / revenu / transfert)
- [x] Compte(s)
- [x] Catégorie / sous-catégorie
- [x] Montant min / max
- [x] Texte dans la note
- [x] Couleur / marqueur
- [x] Avec / sans photo
- [x] Récurrente oui / non
- [x] Carte spécifique
- [x] Filtres combinables (ET)
- [x] Compteur filtres actifs + réinitialiser

---

### 17. Recherche

- [x] Barre de recherche (Activité)
- [x] Recherche note, catégorie, compte, montant, date
- [x] Résultats groupés par jour
- [x] Compatible avec filtres actifs

---

### 18. Photos et reçus

- [x] Schéma données `receipts` (backend)
- [x] Prendre une photo
- [x] Importer depuis galerie / fichiers
- [x] Visualiser la photo
- [x] Remplacer / supprimer
- [x] ~~Extraction OCR montant / date / marchand (Tesseract, Edge Function)~~ — retiré (juillet 2026) : trop coûteux en ressources ; les reçus restent des photos manuelles
- [x] ~~Validation utilisateur avant enregistrement~~ — n/a sans OCR

---

### 24. Notes et couleurs

- [x] Note texte libre sur transaction
- [x] Palette couleurs / marqueurs sur transaction
- [x] Filtre par couleur

---

### 22. Gestion depuis ordinateur (parité)

- [x] Dashboard desktop
- [x] Sidebar + contenu large
- [x] Calendrier desktop
- [x] Statistiques desktop
- [x] Import / export desktop
- [x] Raccourcis clavier saisie rapide

---

## P3 — Patrimoine & avancé

### 10. Groupes de comptes

- [x] Groupes par défaut (banque, espèces, cartes, épargne…)
- [x] Créer un groupe perso (schéma Supabase `account_groups`)
- [x] Assigner comptes aux groupes (`group_id` sur compte)
- [x] Afficher / masquer un groupe (via masquage compte)
- [x] Inclure / exclure du total général

---

### 11. Gestion des cartes bancaires

- [x] Fiche carte (débit / crédit)
- [x] Lier à un compte bancaire (type compte)
- [x] Suivi montant utilisé (crédit) — plafond carte
- [x] Date de paiement + rappel visuel
- [x] Enregistrer règlement carte (= transfert)
- [-] Cashback / remises (optionnel)

---

### 12. Prêts, dettes et découverts

- [x] Créer prêt / dette (type compte `loan`, `overdraft`)
- [x] Montant initial + restant dû (solde compte)
- [x] Enregistrer remboursements (transactions)
- [x] Impact sur patrimoine net
- [x] Historique lié (filtre Activité)

---

### 14. Paiements en plusieurs fois

- [x] Créer plan fractionné (total, échéances, fréquence)
- [x] Suivi échéances passées / restantes
- [x] Lien chaque échéance → transaction
- [x] Suppression plan (choix conserver historique)

---

### 19. Sauvegarde et restauration

- [x] Sync cloud continue (compte Sereno)
- [x] Export sauvegarde manuelle complète
- [x] Restauration depuis fichier
- [x] Aperçu avant restauration (fusion vs remplacement)
- [x] Sauvegarde / restauration des photos
- [x] Indicateur « Dernière sync »

---

### 20. Import de données

- [x] Import fichier structuré (tableur)
- [x] Mapping colonnes → champs
- [x] Aperçu + détection erreurs
- [x] Anti-doublons
- [x] Création auto comptes / catégories manquants

---

### 21. Export de données

- [x] Export transactions (filtrable)
- [x] Export comptes, catégories, budgets
- [x] Export stats (optionnel)

---

### 23. Personnalisation

- [x] Mode clair
- [x] Mode sombre
- [x] Thème système
- [x] Écran de démarrage personnalisable
- [x] Début de semaine (lundi / dimanche)
- [x] Activer / désactiver boutons saisie rapide
- [-] Notifications budgets (optionnel)

---

### 25. Écran de démarrage personnalisable

- [x] Choix : Dashboard, Activité, Calendrier, Stats, Comptes
- [x] Mémorisé par profil / appareil

---

### 26. Devises

- [x] EUR par défaut (profil + comptes)
- [-] Devise principale du profil (multi-devises)
- [-] Devise par compte
- [-] Affichage consolidé multi-devises
- [-] Import avec colonne devise

---

## Backend & données (suivi interne)

> Visible produit indirectement — cocher quand livré côté données.

- [x] Schéma Supabase initial (profiles, accounts, categories, transactions, budgets, recurring)
- [x] RLS par utilisateur
- [x] Partie double (`ledger_accounts`, `journal_entries`)
- [x] RPC `create_transaction_with_entries`
- [x] RPC `update_transaction_with_entries`
- [x] RPC `create_transaction_with_entries_core` (récurrences)
- [x] Table `merchants` (smart suggestions — UI à faire)
- [x] Table `budget_snapshots` (alertes prédictives — UI à faire)
- [x] Table `receipts` + UI attach + OCR
- [x] Vue `net_worth_daily`
- [x] Bucket Storage `receipts` + policies
- [x] Edge Function OCR Tesseract (`process-receipt`)
- [x] RPC transfert entre comptes

---

## Journal des livraisons

| Date | Tâche(s) terminée(s) | Notes |
|------|----------------------|-------|
| 2026-07-02 | **Backlog complet P1–P3 (MVP)** | Filtres, statuts tx, budgets avancés, comptes/catégories enrichis, calendrier semaine, parité desktop, réglages, import/export, échéances, thème |
| 2026-07-02 | Notes et couleurs (marqueur palette minérale, picker édition, filtre Activité, migration `marker_color`) | P2 §24, P1 §2, P2 §16 |
| 2026-07-02 | Virements inter-comptes (type transfer, RPC ledger, UI `/transferts`) | P2 §4, P1 §2 |
| 2026-07-02 | Statistiques : patrimoine actuel, courbe mensuelle, rythme revenus | P2 §6 |
| 2026-07-02 | Récurrences : pause/reprise, aperçu échéances, fix état actif à l’édition | P1 §13 |
| 2026-07-02 | Budgets : alerte 80 % visuelle + copie depuis le mois précédent | P1 §7 |
| 2026-07-02 | Écrans Statistiques et Calendrier (grilles, graphiques, liens Activité) | P2 §5–6, §27 |
| 2026-07-02 | Recherche + filtres avancés sur Activité (panneau combiné, lien compte dashboard) | P1 §2, P2 §16–17 |
| 2026-07-02 | Modèles / favoris (CRUD, épinglage, saisie rapide, migration cloud) | P2 §15 |
| 2026-07-02 | Photos / reçus (attach, preview, OCR Tesseract, suggestions) | P2 §18 |
| 2026-07-02 | Sous-catégories (création, promotion, réassignation, picker, budgets) | P1 §8 |
| 2026-07-02 | Dashboard enrichi (solde restant, rythme jour/semaine/mois, comptes, budgets, actions rapides) | P1 §1 |
| 2026-07-02 | Partie double, RPC transactions, migration Supabase | Backend comptable |
| 2026-07-02 | Layout desktop (sidebar, dashboard 2 col.) | ≥ 768px |

---

## Comment utiliser ce fichier

1. Choisir une tâche `[ ]` dans la phase en cours (P1 recommandé).
2. Passer en `[~]` quand on démarre.
3. Passer en `[x]` quand c’est livré et vérifié.
4. Ajouter une ligne dans **Journal des livraisons**.
5. Mettre à jour la colonne **Avancement** des phases si besoin.

**Prochaine tâche suggérée :** `[-]` Multi-devises (§26) **ou** `[-]` Smart suggestions marchands (table `merchants`).

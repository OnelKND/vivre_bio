# Intégration FedaPay — paiement en ligne optionnel + refonte admin commandes

Date : 2026-08-29

## Contexte

VIVRE BIO fonctionne aujourd'hui en paiement à la livraison uniquement
(cash / Mobile Money manuel). Le client demande d'ajouter FedaPay comme
option de paiement en ligne au moment de la commande, et de revoir
l'architecture des commandes côté admin pour refléter ce nouveau statut
de paiement (avec une vue d'ensemble/stats).

Décision produit actée avec le client : FedaPay s'ajoute au paiement à
la livraison existant, il ne le remplace pas. Le client choisit son
mode de paiement au moment de passer commande.

## Décisions validées

- **Mode de paiement** : choix au checkout entre "paiement à la
  livraison" (comportement actuel, inchangé) et "payer en ligne via
  FedaPay".
- **Flux FedaPay** : widget `Checkout.js` (modal), pas de redirection
  hébergée — le client reste sur vivrebio.bj.
- **Création de commande** : la commande est créée en base dès la
  soumission du formulaire, quel que soit le mode de paiement. Pour
  FedaPay, elle démarre avec `payment_status = "en_attente"` et est mise
  à jour via webhook. Ça permet de garder une trace des paniers
  abandonnés / paiements échoués.
- **Décrément de stock** : pour le cash, comportement actuel inchangé
  (décrément immédiat à la création). Pour FedaPay, le stock n'est
  décrémenté qu'à la confirmation du paiement (webhook `approved`) —
  pour ne pas bloquer du stock sur des paiements jamais finalisés.
- **Statuts** : le statut de paiement est un axe **séparé** du statut de
  livraison existant (`recue/preparation/expediee/livree`, inchangé).
  Une commande peut être "en préparation" + "payée" simultanément.
- **Admin** : au-delà d'afficher le statut de paiement, ajout d'un
  bandeau de stats en haut de la liste (total encaissé, répartition
  cash/FedaPay, nombre de paiements en attente).

## Modèle de données

Nouvelles colonnes sur la table `orders` (migration additive, pas de
perte de données existantes — toutes les commandes historiques sont
`payment_method = "cash"`, `payment_status = "non_requis"`) :

| Colonne | Type | Valeurs |
|---|---|---|
| `payment_method` | TEXT NOT NULL DEFAULT 'cash' | `"cash" \| "fedapay"` |
| `payment_status` | TEXT NOT NULL DEFAULT 'non_requis' | `"non_requis" \| "en_attente" \| "paye" \| "echoue"` |
| `fedapay_transaction_id` | TEXT NULL | id de transaction FedaPay, pour réconcilier le webhook et lier vers le dashboard FedaPay |

Règles :
- `payment_method = "cash"` → `payment_status` toujours `"non_requis"`.
- `payment_method = "fedapay"` → `payment_status` commence à
  `"en_attente"`, transite vers `"paye"` ou `"echoue"` uniquement via le
  webhook (jamais modifiable manuellement depuis l'admin, pour éviter
  qu'un statut "payé" soit déclaré sans confirmation réelle de FedaPay).

`lib/order-status.ts` (types partagés, importables côté client) gagne
les types `PaymentMethod`, `PaymentStatus`, et les labels/badges
associés — même pattern que `OrderStatus` existant.

## Flux commande (`app/commande`)

1. `CheckoutPageClient.tsx` : ajout d'un choix de mode de paiement
   (radio, même style que le choix de zone de livraison existant).
2. `actions.ts` (`createOrder`) : le schéma zod accepte
   `paymentMethod: "cash" | "fedapay"`. La commande est insérée avec ce
   mode et le `payment_status` dérivé. Pour `cash`, comportement
   strictement identique à l'existant (décrément stock + email
   immédiats). Pour `fedapay`, ni décrément ni email de notification à
   la création — ils sont différés au webhook.
3. Pour FedaPay, après insertion, la réponse embarque de quoi ouvrir le
   widget `Checkout.js` (clé publique, montant, référence = id de
   commande) — le widget s'ouvre sur `/commande/confirmation/[id]`
   directement après redirection, avant que la page affiche l'état
   "commande confirmée".
4. Nouvelle route `app/api/fedapay/webhook/route.ts` (App Router route
   handler, pas server action — doit être appelable par FedaPay depuis
   l'extérieur) :
   - Vérifie la signature du webhook avec `FEDAPAY_WEBHOOK_SECRET`
     (rejette avec 401 si invalide — jamais confiance dans un payload
     non signé).
   - Sur `transaction.approved` : `payment_status = "paye"`,
     décrémente le stock des articles de la commande, envoie l'email
     de notification (réutilise `sendOrderNotificationEmail`).
   - Sur `transaction.declined`/`canceled` : `payment_status =
     "echoue"`, aucun décrément.
   - Idempotent : si la commande est déjà `"paye"`, un événement
     dupliqué ne redécrémente pas le stock une deuxième fois.

## Configuration

Nouvelles variables d'env (`.env.example`) :
```
FEDAPAY_PUBLIC_KEY=
FEDAPAY_SECRET_KEY=
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_ENVIRONMENT=sandbox
```

## Admin (`app/admin`)

- **Liste (`/admin`)** :
  - Bandeau de stats au-dessus des filtres : total encaissé (respecte
    les filtres actifs), répartition cash vs FedaPay, nombre de
    commandes FedaPay `"en_attente"`.
  - Nouvelle colonne "Paiement" dans le tableau (badge mode + badge
    statut paiement), distincte de la colonne "Statut" (livraison)
    existante.
  - Nouveau filtre "Statut paiement" en plus du filtre statut livraison
    existant (paramètre d'URL `paiement=`).
- **Détail (`/admin/commandes/[id]`)** : bloc "Paiement" séparé du bloc
  produits/livraison — mode, statut, référence `fedapay_transaction_id`
  si présente. Le statut de paiement n'est **pas** modifiable via un
  formulaire (contrairement au statut de livraison) : il ne change que
  par webhook, pour rester fidèle à la réalité FedaPay.
- **Export CSV** (`/admin/commandes/export`) : colonnes `payment_method`
  et `payment_status` ajoutées.

## Hors périmètre

- Remboursements FedaPay (pas demandé).
- Retry manuel de paiement échoué depuis l'admin (le client repasse
  commande si besoin).
- Notifications SMS/WhatsApp automatiques sur changement de statut de
  paiement (l'email existant suffit pour l'instant).

## Tests

- `lib/order-pricing.test.ts` / nouveaux tests sur l'insertion avec
  `payment_method`/`payment_status`.
- Test du webhook : signature valide/invalide, transition
  `en_attente → paye` avec décrément stock, idempotence sur événement
  dupliqué, transition `en_attente → echoue` sans décrément.

---
name: admin-guide-design-spec
description: Design specification for the admin user guide (PDF + integrated web page) of VIVRE BIO.
metadata:
  type: reference
---
# Design Specification – Guide d’utilisation admin

**Date** : 2024‑09‑17

## Objectif
Fournir une documentation complète, en français, destinée aux administrateurs du back‑office : 
- PDF téléchargeable (versionnable dans le repo). 
- Page web intégrée à l’application (`/admin/guide`) affichant le même contenu et proposant le téléchargement du PDF.

## Portée
- Couvrir la présentation du projet, l’installation, la navigation, les fonctionnalités clés, la FAQ et les annexes.
- Le PDF devra être régénéré automatiquement à chaque modification du Markdown source.
- La page web doit être accessible depuis le site live : https://vivrebio-production.up.railway.app/.

## Structure du contenu (Markdown source)
```
/docs/admin-guide/user-guide-admin.md
    ├─ 01‑presentation.md
    ├─ 02‑installation.md
    ├─ 03‑navigation.md
    ├─ 04‑gestion‑produits.md
    ├─ 05‑gestion‑commandes‑paiement.md
    ├─ 06‑gestion‑avis‑articles.md
    ├─ 07‑zones‑livraison.md
    ├─ 08‑faq.md
    ├─ 09‑annexes.md
    └─ images/ (captures d’écran à ajouter par le contributeur)
```

## Gestion des illustrations
- Les captures d’écran seront placées dans `docs/admin-guide/images/`.
- Le Markdown les référencera avec `![](images/<nom>.png)`.
- Aucun outil de génération d’images n’est requis ; vous les ajouterez manuellement.

## Génération du PDF
- **Outil** : `pandoc` (ou `mdpdf`).
- **Script npm** : `npm run guide:pdf` (défini dans `package.json`).
- **Commande** : `pandoc docs/admin-guide/user-guide-admin.md -o public/docs/admin-guide.pdf --pdf-engine=wkhtmltopdf`.
- Le PDF sera produit dans `public/docs/` afin d’être servi statiquement.

## Page web intégrée
- **Route** : `/admin/guide` (Next.js). 
- Le composant utilise `react-markdown` ou `next-mdx-remote` pour rendre le Markdown.
- Un bouton `Télécharger le PDF` pointe vers `/docs/admin-guide.pdf`.
- Le style doit respecter la charte VIVRE BIO (vert #2E7D32, rouge #E31E24) et la typographie existante.

## CI / automatisation
```yaml
name: Build admin guide PDF
on:
  push:
    paths:
      - 'docs/admin-guide/**'
jobs:
  pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y pandoc wkhtmltopdf
      - name: Install node deps
        run: npm ci
      - name: Build PDF
        run: npm run guide:pdf
      - name: Commit PDF
        uses: EndBug/add-and-commit@v9
        with:
          message: "🗎 Regénère le PDF du guide admin"
          add: "public/docs/admin-guide.pdf"
```

## Tests de validation
1. **Build local** : `npm run guide:pdf` doit générer un PDF sans erreur.
2. **Vérifier le rendu** : ouvrir `public/docs/admin-guide.pdf` et s’assurer que les images s’affichent.
3. **Navigation web** : lancer `npm run dev`, accéder à `/admin/guide`, vérifier la présence du bouton de téléchargement et le bon rendu du Markdown.
4. **CI** : pousser une modification mineure du Markdown, vérifier que le job GitHub Actions s’exécute et que le PDF mis à jour apparaît dans le dépôt.

## Historique des révisions
- **v0.1** : création du spec (2024‑09‑17).

---

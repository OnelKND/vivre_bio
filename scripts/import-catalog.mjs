// Script one-off : import en masse du catalogue fourni par le client.
// Saute silencieusement tout produit dont le slug existe déjà en base.
// Sans photo réelle disponible, dépose un médaillon-lettre en SVG (même
// style que les placeholders déjà utilisés sur le site).
import { DatabaseSync } from "node:sqlite";
import { writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "vivrebio.db");
const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLetterPlaceholderSvg(name) {
  const letter = (name.trim().charAt(0) || "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-hidden="true">
  <rect width="400" height="400" fill="#F5F3ED" />
  <circle cx="200" cy="180" r="90" fill="#2E7D32" fill-opacity="0.9" />
  <text x="200" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">${letter}</text>
  <rect x="150" y="290" width="100" height="16" rx="8" fill="#2E7D32" fill-opacity="0.25" />
</svg>
`;
}

// name, shortDescription, description, price, volumeMl
const CATALOG = {
  "huiles-essentielles": {
    volumeMl: 10,
    items: [
      ["Huile essentielle de Citronnelle de Ceylan", "Désodorisante, purifiante et répulsive naturelle.", "Cousine de la citronnelle de Java, elle se distingue par ses notes fraîches idéales pour neutraliser les mauvaises odeurs, assainir la maison et repousser les insectes volants. Elle aide aussi à tonifier le cuir chevelu.", 1500],
      ["Huile essentielle de Nard", "Huile ancestrale apaisante et stimulante capillaire.", "Utilisée depuis l'Antiquité, le Nard est réputé pour calmer l'esprit et favoriser l'équilibre émotionnel. En cosmétique, il stimule la repousse des cheveux et traite les problèmes de cuir chevelu.", 1500],
      ["Huile essentielle de Niaouli", "Protectrice, purifiante et soutien des défenses naturelles.", "Cousine de l'Arbre à thé, l'huile essentielle de Niaouli est idéale pour accompagner les épisodes infectieux hivernaux ou respiratoires. Elle est aussi tonifiante pour les peaux à problèmes.", 3200],
      ["Huile essentielle d'Orange douce", "Parfum fruité réconfortant, rééquilibrant et assainissant.", "Elle apporte la bonne humeur, calme les tensions et assainit l'air de votre intérieur. Elle aide également à tonifier la peau et à lutter contre l'aspect de la cellulite.", 3500],
      ["Huile essentielle d'Origan", "Bouclier naturel puissant contre les agressions extérieures.", "L'une des huiles essentielles les plus puissantes sur le plan anti-infectieux et antibactérien. Un véritable \"antibiotique naturel\" idéal lors des périodes de fatigue intense.", 4000],
      ["Huile essentielle de Pamplemousse rose", "Tonique cutané, drainant et raffermissant.", "Idéale pour affiner la silhouette et lutter contre la rétention d'eau et la cellulite. Elle purifie également les peaux grasses et stimule le cuir chevelu.", 4000],
      ["Huile essentielle de Patchouli", "Parfum envoûtant, favorise la circulation et la réparation cutanée.", "Très appréciée pour sa senteur boisée orientale, elle régénère les peaux sèches, matures ou sujettes à l'eczéma. Elle favorise également le confort veineux (jambes lourdes).", 4000],
      ["Huile essentielle de Poivre long", "Chauffante, tonifiante et préparatrice musculaire.", "Grâce à ses propriétés stimulantes et chauffantes, elle aide à décontracter les muscles fatigués, soulager les courbatures et stimuler la circulation sanguine.", 3500],
      ["Huile essentielle de Ravintsara", "L'immunité au naturel, antivirale et décongestionnante.", "Référence absolue pour prévenir et combattre les virus saisonniers. Elle renforce les défenses immunitaires, dégage les voies respiratoires et aide à lutter contre la fatigue physique.", 6000],
      ["Huile essentielle de Romarin", "Revitalisant capillaire et tonique intellectuel.", "Reconnue pour freiner la chute des cheveux et stimuler leur repousse. Elle favorise la mémoire, la concentration et aide à décongestionner le foie et les muscles.", 5000],
      ["Huile essentielle de Rose de Damas", "Reine des fleurs, anti-âge d'exception et harmonisante.", "Un soin d'exception pour réveiller la jeunesse de la peau. Elle lisse les rides, tonifie les tissus et apporte un apaisement émotionnel intense lors des moments de chagrin ou stress.", 5500],
      ["Huile essentielle de Sauge", "Équilibrante féminine et régulatrice de transpiration.", "Réputée pour accompagner le confort féminin (cycles menstruels, ménopause) et réguler la transpiration excessive ainsi que le sébum des cheveux.", 5000],
      ["Huile essentielle de Tchayo", "Plante traditionnelle apaisante et réparatrice.", "Extraite d'une plante de la pharmacopée traditionnelle locale (Basilic africain), elle offre de remarquables vertus apaisantes, purifiantes et aide à calmer les irritations cutanées.", 4800],
      ["Huile essentielle de Thé vert", "Antioxydante, rafraîchissante et purifiante.", "Apporte une protection contre le vieillissement prématuré grâce à ses composés antioxydants. Elle rafraîchit l'épiderme et tonifie les peaux dévitalisées.", 3500],
      ["Huile essentielle de Thym", "Purifiant général et soutien respiratoire.", "Connu pour ses puissantes vertus assainissantes, le Thym aide à combattre les refroidissements, à assainir l'appareil respiratoire et à booster la vitalité générale.", 4000],
      ["Huile essentielle de Vanille", "Parfum gourmand, relaxant et adoucissant.", "Son odeur douce et réconfortante réduit l'anxiété, invite à la détente et apporte une note suave à vos soins corporels. Elle adoucit et assouplit la peau.", 4000],
      ["Huile essentielle de Verveine citronnée", "Anti-stress majeur, apaisante et senteur citronnée élégante.", "L'une des meilleures huiles pour retrouver calme et sérénité. Elle aide à dissiper le stress, les baisses de moral et favorise un sommeil paisible.", 4500],
      ["Huile essentielle d'Aglala", "Extrait végétal purifiant et tonifiant.", "Huile traditionnelle reconnue pour ses propriétés purifiantes sur la peau et ses vertus relaxantes pour apaiser les tensions légères.", 3500],
    ],
  },
  "huiles-vegetales": {
    volumeMl: 100,
    items: [
      ["Huile végétale de Sésame", "Nourrissante, assouplissante et absorbante rapide.", "Riche en acides gras essentiels, elle pénètre rapidement sans laisser de film gras. Elle régénère la peau, la protège des agressions extérieures et convient très bien aux massages.", 2500],
      ["Huile végétale d'Olive", "Hydratante intense et protectrice pour peaux très sèches.", "Très riche en antioxydants et vitamine E, elle nourrit en profondeur les peaux les plus desséchées et fortifie les cheveux cassants et abîmés.", 3500],
      ["Huile végétale de Moringa", "L'or vert nutritionnel pour la peau et les cheveux.", "Exceptionnellement riche en vitamines et minéraux, l'huile de Moringa restaure le film hydrolipidique de la peau, revitalise les teints ternes et apporte une brillance incomparable aux cheveux.", 7000],
      ["Huile végétale de Tcho Tcho", "Soin réparateur et apaisant issu du terroir.", "Huile traditionnelle réputée pour calmer les irritations légères, adoucir la peau sèche et sceller l'hydratation des cheveux texturés.", 1000],
      ["Huile végétale de Curcuma", "Unifiante, anti-taches et éclat du teint.", "Idéale pour harmoniser le teint, atténuer les taches sombres et apporter une bonne mine naturelle grâce à ses vertus antioxydantes.", 2000],
      ["Huile végétale d'Ail", "Anti-chute et stimulant puissant de repousse capillaire.", "Ingrédient phare pour freiner la chute des cheveux, lutter contre les pellicules et activer la circulation sanguine du cuir chevelu pour accélérer la repousse.", 2500],
      ["Huile végétale de Neem", "Purifiante, antibactérienne et anti-imperfections.", "L'huile nettoyante par excellence pour les peaux à problèmes ou sujettes aux imperfections. Elle est aussi très efficace pour assainir le cuir chevelu.", 2500],
      ["Huile végétale de Chébé", "Le secret tchadien pour la rétention de longueur capillaire.", "Infusée à la poudre de Chébé, cette huile nourrit la fibre capillaire, prévient la casse des pointes et aide à maintenir l'hydratation pour des cheveux plus longs et forts.", 2500],
      ["Huile végétale de Souchet", "Ralentit la pousse des poils et nourrit la peau.", "Traditionnellement utilisée pour freiner la repousse des poils après épilation, elle est également très nourrissante et préserve l'élasticité de la peau.", 2500],
      ["Huile végétale de Coco", "Soin polyvalent nourrissant, protecteur et parfumé.", "Un classique incontournable : elle nourrit intensément les cheveux, protège la peau de la déshydratation et s'utilise aussi bien en démaquillant qu'en soin corporel.", 1000],
      ["Huile végétale de Nigelle", "Purifiante, apaisante et réparatrice pour peaux à problèmes.", "Connue sous le nom d'huile de Cumin Noir, elle apaise les inflammations cutanées (acné, eczéma) et renforce les cheveux fragilisés.", 2000],
      ["Huile végétale de Chanvre", "Rééquilibre, anti-rougeurs et non comédogène.", "Très riche en oméga-3 et 6, elle redonne souplesse à la peau, apaise les rougeurs et convient parfaitement aux peaux mixtes à grasses grâce à son toucher sec.", 3000],
      ["Huile végétale de Jojoba", "Régulatrice de sébum, proche du sébum naturel de la peau.", "Convient à tous les types de peau. Elle rééquilibre la production de sébum, hydrate sans boucher les pores et revitalise les cheveux secs ou gras.", 3000],
      ["Huile végétale de Ricin", "Fortifiante ultime pour cheveux, ongles et cils.", "Connue pour sa texture dense qui fortifie, gaine et stimule la pousse des cheveux, des cils, de la barbe et des ongles.", 3500],
      ["Huile végétale de Fenugrec", "Galbante, tonifiante et nourrissante.", "Connue pour raffermir les tissus et apporter du galbe à la poitrine et aux fessiers, tout en stimulant la pousse des cheveux.", 2500],
    ],
  },
  poudres: {
    volumeMl: 100,
    items: [
      ["Poudre de Cannelle", "Purifiante, stimulante et coup d'éclat.", "Stimule la circulation sanguine, purifie les peaux mixtes à grasse et apporte de la vitalité aux cheveux.", 3000],
      ["Poudre de Clou de Girofle", "Assainissante, stimulante et nettoyante.", "Idéale pour assainir le cuir chevelu, stimuler la pousse et lutter contre les bactéries cutanées.", 3000],
      ["Poudre de Petit Cola", "Tonique naturel et revitalisant.", "Reconnue dans la tradition pour ses vertus stimulantes et tonifiantes sur l'organisme.", 3000],
      ["Poudre Graine de fruit de Noni", "Super-aliment antioxydant et régénérant.", "Riche en nutriments, elle aide à renforcer le système immunitaire et à lutter contre le vieillissement cellulaire.", 3000],
      ["Poudre de Moringa", "Super-aliment complet et fortifiant capillaire.", "Véritable concentré de vitamines, elle nourrit le corps de l'intérieur et apporte force et brillance aux cheveux en masque.", 1500],
      ["Poudre de Curcuma", "Anti-inflammatoire et illuminatrice de teint.", "Ravive le teint, atténue les imperfections et apporte une action antioxydante globale.", 1000],
      ["Poudre de Poivre long", "Stimulante digestive et tonifiante.", "Aide à réchauffer l'organisme, favorise la digestion et stimule la vitalité.", 1000],
      ["Poudre d'Argile verte", "Absorbante, purifiante et détoxifiante majeure.", "Absorbe l'excès de sébum, purifie les peaux à imperfections et désincruste les pores en profondeur.", 3000],
      ["Poudre de Néré", "Fortifiante et nutritive traditionnelle.", "Riche en protéines et minéraux, elle est traditionnellement utilisée pour soutenir l'énergie et la vitalité.", 1000],
      ["Poudre de Caïlcédrat", "Soin purifiant et amer traditionnel.", "Reconnue dans la pharmacopée africaine pour ses vertus assainissantes et tonifiantes.", 2000],
      ["Poudre de Cacao", "Gourmande, antioxydante et adoucissante.", "Riche en polyphénols, elle protège la peau du vieillissement et apporte douceur et éclat aux masques corporels.", 3000],
      ["Poudre de Baobab (Pain de singe)", "Richesse en vitamine C, énergisante et anti-âge.", "Un puissant antioxydant qui booste l'énergie, soutient la digestion et apporte souplesse à la peau.", 2000],
      ["Poudre de Souchet", "Naturellement sucrée, riche en fibres et nourrissante.", "Exempte de gluten, elle est excellente pour le confort digestif et apporte douceur aux soins cutanés.", 3500],
    ],
  },
  graines: {
    volumeMl: 100,
    items: [
      ["Noix Amandes", "Encas nutritif riche en vitamine E et bons lipides.", "Idéales pour la santé cardiovasculaire, la mémoire et le maintien d'une peau en bonne santé.", 3000],
      ["Graines de Quinquéliba", "Détoxifiante et protectrice du foie.", "Utilisées traditionnellement pour faciliter la digestion, purifier l'organisme et éliminer les toxines.", 1000],
      ["Graines de Nigelle", "Renforcent le système immunitaire et la vitalité.", "Graines bénies reconnues pour leurs propriétés stimulantes immunitaires et digestives.", 2000],
      ["Graines de Chia", "Super-aliment riche en Oméga-3 et fibres.", "Favorisent la satiété, améliorent le transit digestif et apportent une énergie durable.", 3000],
      ["Graines de Lin", "Incontournables pour la digestion et le gel capillaire.", "Excellentes pour le transit intestinal et utilisées pour fabriquer un gel hydratant naturel pour cheveux bouclés.", 2000],
      ["Graines de Fenugrec", "Stimulent l'appétit, le galbe et la pousse des cheveux.", "Riches en protéines, elles aident à fortifier la chevelure et sont reconnues pour tonifier les formes.", 2000],
      ["Bâtons de Cannelle", "Épice parfumée, stimulante et régulatrice de glycémie.", "Parfaits pour infuser dans les boissons chaudes, ils stimulent la digestion et apportent un arôme réconfortant.", 1000],
      ["Graines de Sésame", "Riches en calcium et minéraux essentiels.", "Apportent du croquant à vos plats tout en soutenant la santé osseuse et le système nerveux.", 1000],
    ],
  },
  infusions: {
    volumeMl: 50,
    items: [
      ["Infusion Ventre plat", "Synergie détox pour réduire les ballonnements.", "Un mélange d'herbes ciblé pour faciliter la digestion, dégonfler le ventre et éliminer les toxines retenues.", 3000],
      ["Infusion de Curcuma", "Boisson anti-inflammatoire et réconfortante.", "Aide à apaiser les articulations, soutient le système digestif et booste les défenses naturelles.", 2000],
      ["Infusion de Clous de Girofle", "Purifiante, stimulante et protectrice.", "Idéale pour désinfecter l'organisme de l'intérieur, soulager les désagréments de la gorge et stimuler la vitalité.", 2000],
      ["Infusion de Cannelle", "Douceur chauffante et stimulante.", "Aide à réguler le sucre dans le sang, réchauffe le corps et soulage les lourdeurs digestives.", 1500],
      ["Ortie", "Reminéralisante et détoxifiante complète.", "Plante exceptionnellement riche en fer et minéraux, idéale contre la fatigue et pour assainir la peau.", 2000],
      ["Infusion de Thé Rouge (Rooibos)", "Relaxante, sans théine et riche en antioxydants.", "Peut être consommée à toute heure de la journée pour apaiser l'esprit et lutter contre le stress oxydatif.", 2000],
      ["Artémisia", "Tisane traditionnelle fortifiante et protectrice.", "Reconnue dans la tradition pour soutenir le système immunitaire et aider l'organisme à faire face aux agressions.", 1000],
      ["Infusion de Thym", "Nettoyante pour la gorge et les voies respiratoires.", "Le réflexe tisane en cas de coup de froid pour apaiser la gorge et assainir la digestion.", 2000],
      ["Racine de Ginseng", "Tonique physique et mental d'exception.", "Aide à surmonter la fatigue, améliore la concentration et renforce la résistance de l'organisme.", 1000],
    ],
  },
  "cosmetiques-reparateurs": {
    volumeMl: 100,
    items: [
      ["Beurre de massage", "Soin fondant pour détendre les muscles et nourrir la peau.", "Fond au contact de la peau pour offrir un massage glissant, relaxant les tensions musculaires tout en laissant la peau douce.", 2500],
      ["Beurre de Karité", "Nourrissant et protecteur universel.", "Protecteur, réparateur et adoucissant brut. Indispensable pour sceller l'hydratation de la peau et des cheveux.", 2000],
      ["Savon visage", "Nettoyage doux respectueux de l'équilibre cutané.", "Élimine les impuretés en douceur sans assécher l'épiderme, laissant le visage propre et frais.", 1000],
      ["Lotion pour le visage", "Tonifie, rafraîchit et prépare la peau aux soins.", "Resserre les pores, rééquilibre le pH cutané et apporte une vague de fraîcheur instantanée.", 2000],
      ["Beurre de Cacao", "Soin gourmand ultra-nourrissant et anti-vergetures.", "Riche en acides gras, il améliore l'élasticité de la peau, prévient les vergetures et laisse une odeur chocolatée envoûtante.", 1500],
      ["Shampoing", "Nettoie en douceur le cuir chevelu sans l'agresser.", "Formulé pour éliminer le sébum et les résidus tout en préservant l'hydratation naturelle des cheveux.", 2000],
      ["Huile corporelle", "Élixir satinant et nourrissant pour le corps.", "Sublime le grain de peau, apporte de la nutrition et enveloppe le corps d'un voile protecteur et doux.", 4000],
      ["Poudre anti-acné", "Soin local assainissant et sébo-régulateur.", "Synergie de plantes purifiantes qui aide à assécher les boutons, purifier les pores et réduire les rougeurs.", 3000],
      ["Savon noir 7 épices", "Exfoliant et nettoyant profond traditionnel.", "Purifie la peau en profondeur, élimine les cellules mortes et laisse un grain de peau lisse et unifié.", 2500],
      ["Savon Kortor", "Savon réparateur et apaisant traditionnel.", "Formulé pour soulager les démangeaisons, assainir les peaux sensibles ou sujettes aux imperfections.", 2000],
      ["Huile Boost Hair", "Sérum activateur de repousse et de densité.", "Un cocktail d'huiles végétales et essentielles précieuses qui stimulent le cuir chevelu, renforcent les racines et accélèrent la pousse.", 5000],
    ],
  },
  "produits-de-la-ruche": {
    items: [
      ["Miel (1 L)", "Miel pur, naturel et plein de bienfaits.", "Cicatrisant, adoucissant et naturellement antiseptique. S'utilise aussi bien en cuisine qu'en soin cosmétique (masque visage hydratant).", 4000, 1000],
      ["Miel (½ L)", "Miel pur, naturel et plein de bienfaits.", "Cicatrisant, adoucissant et naturellement antiseptique. S'utilise aussi bien en cuisine qu'en soin cosmétique (masque visage hydratant).", 2000, 500],
      ["Miel Owin-Vital", "Miel enrichi pour un boost d'énergie et de vitalité.", "Formulé pour renforcer l'organisme, combattre la fatigue et stimuler les défenses immunitaires naturelles.", 3000, 250],
    ],
  },
  "alimentation-bio": {
    items: [
      ["Gari amélioré", "Cassave de manioc enrichie et croustillante.", "Préparé selon des normes de qualité strictes pour offrir un aliment sain, nutritif et facile à consommer.", 1500, 500],
      ["Huile d'arachide (1 litre)", "Huile de cuisson pure et naturelle.", "Extraite proprement, idéale pour une cuisine quotidienne saine et riche en bons lipides.", 1800, 1000],
      ["Beurre d'acajou", "Pâte gourmande et nutritive aux noix de cajou.", "Une alternative saine et riche en protéines pour vos tartines et recettes énergétiques.", 4000, 200],
      ["Noix d'acajou", "Croquantes, grillées et riches en minéraux.", "L'encas parfait pour faire le plein de magnésium et d'énergie au quotidien.", 4000, 200],
      ["Pâte à tartiner bio", "La gourmandise saine sans additifs nocifs.", "Une alternative bio et équilibrée pour régaler toute la famille au petit-déjeuner.", 3500, 250],
      ["Five Nuts", "Mélange d'élite de 5 oléagineux super-nutritifs.", "Assortiment de noix sélectionnées pour un apport complet en oméga-3, protéines et minéraux.", 6000, 250],
      ["Huile de coco alimentaire (1 litre)", "Huile vierge pressée à froid pour la cuisine et la santé.", "Stable à la cuisson, elle apporte une touche délicate à vos plats tout en soutenant le métabolisme.", 6000, 1000],
    ],
  },
  "autres-produits-bio": {
    items: [
      ["Charbon végétal activé", "Détoxifiant digestif et blanchissant dentaire.", "Absorbe les gaz, soulage les ballonnements et s'utilise en soin dentaire pour éliminer les taches superficielles.", 2500, 100],
      ["Cristaux de menthe", "Fraîcheur intense et décongestionnant puissant.", "Idéaux pour libérer les voies respiratoires en inhalation ou apporter un effet rafraîchissant aux préparations.", 1000, 50],
      ["Sel de bain", "Relaxation musculaire et détox du corps.", "Soulage la fatigue des pieds et du corps, détend les muscles et adoucit la peau.", 1000, 200],
      ["Sel rose d'Himalaya", "Sel pur non raffiné riche en 84 minéraux.", "Alternative saine au sel de table classique, idéal pour assaisonner vos plats ou pour des bains reminéralisants.", 2500, 250],
      ["Aviti", "Préparation traditionnelle tonifiante.", "Utilisé pour soutenir le bien-être général et stimuler l'énergie naturelle.", 1000, 100],
    ],
  },
};

const db = new DatabaseSync(DB_PATH);

const existingSlugs = new Set(
  db.prepare("SELECT slug FROM products").all().map((row) => row.slug)
);

function uniqueSlug(base) {
  let candidate = base || "produit";
  let suffix = 2;
  while (existingSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

const insert = db.prepare(`
  INSERT INTO products (
    slug, name, category, short_description, description,
    price, volume_ml, image, featured, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let created = 0;
let skipped = 0;

for (const [category, { volumeMl: defaultVolumeMl, items }] of Object.entries(CATALOG)) {
  for (const [name, shortDescription, description, price, volumeMl] of items) {
    const slug = slugify(name);

    if (existingSlugs.has(slug)) {
      skipped += 1;
      continue;
    }

    const finalSlug = uniqueSlug(slug);
    existingSlugs.add(finalSlug);

    const imageFilename = `${finalSlug}.svg`;
    const imagePath = path.join(PRODUCTS_DIR, imageFilename);
    if (!existsSync(imagePath)) {
      writeFileSync(imagePath, buildLetterPlaceholderSvg(name), "utf8");
    }

    insert.run(
      finalSlug,
      name,
      category,
      shortDescription,
      description,
      price,
      volumeMl ?? defaultVolumeMl,
      `/products/${imageFilename}`,
      0,
      new Date().toISOString()
    );
    created += 1;
  }
}

console.log(`Produits créés : ${created}`);
console.log(`Produits déjà présents (sautés) : ${skipped}`);

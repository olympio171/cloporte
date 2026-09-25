/* =========================================================
   Oniscidea — contenus éditoriaux
   Familles, guides par niveau, setups, anatomie, glossaire.
   ========================================================= */
(function () {
  'use strict';

  const LABELS = {
    niveau: {
      0: { nom: 'Observation', court: 'Nature', desc: "Espèce sauvage, protégée ou impossible à maintenir : à observer dans son milieu." },
      1: { nom: 'Débutant', court: 'Débutant', desc: "Robuste, prolifique et tolérante : idéale pour un premier élevage." },
      2: { nom: 'Intermédiaire', court: 'Intermédiaire', desc: "Demande un gradient d'humidité soigné et un peu de patience." },
      3: { nom: 'Expert', court: 'Expert', desc: "Exigeante, lente ou rare : réservée aux éleveurs expérimentés." }
    },
    hum: {
      1: { nom: 'Sec', hr: '50 à 60 %', txt: "Substrat sec en surface, un seul coin humide (environ 10 % de la surface), vaporisé une fois par semaine." },
      2: { nom: 'Modéré', hr: '60 à 70 %', txt: "Un tiers du bac humide en permanence, le reste sec. Humidifiez le coin humide deux fois par semaine." },
      3: { nom: 'Humide', hr: '70 à 80 %', txt: "La moitié du bac humide, sol toujours frais au fond. Arrosez le substrat, pas les animaux." },
      4: { nom: 'Très humide', hr: '80 à 90 %', txt: "Substrat humide presque partout, avec de la sphaigne. La surface doit néanmoins sécher légèrement entre deux arrosages." }
    },
    vent: {
      1: { nom: 'Faible', txt: "Quelques trous d'aération suffisent." },
      2: { nom: 'Moyenne', txt: "Grille sur 20 à 30 % du couvercle." },
      3: { nom: 'Forte', txt: "Grande grille sur le couvercle et aération latérale pour créer un courant d'air." }
    },
    repro: { 1: 'Lente', 2: 'Moyenne', 3: 'Rapide' },
    dispo: {
      0: { nom: 'Non commercialisé', court: 'Introuvable', txt: "Absent des boutiques et des bourses : espèce sauvage, protégée ou impossible à maintenir." },
      1: { nom: 'Très facile à trouver', court: 'Très facile', txt: "Vendu par la plupart des boutiques françaises spécialisées, en ligne et dans les bourses aux reptiles." },
      2: { nom: 'Facile à commander', court: 'Facile', txt: "Proposé par plusieurs boutiques et éleveurs français, parfois en rupture selon les naissances." },
      3: { nom: 'Rare en France', court: 'Rare', txt: "Chez quelques éleveurs spécialisés seulement, stocks irréguliers, souvent importé d'Allemagne ou des Pays-Bas." }
    },
    prix: {
      0: { sym: '—', txt: 'Sans objet' },
      1: { sym: '€', txt: 'Moins de 15 € les 10' },
      2: { sym: '€€', txt: '15 à 30 € les 10' },
      3: { sym: '€€€', txt: '30 à 60 € les 10' },
      4: { sym: '€€€€', txt: 'Plus de 60 € les 10' }
    },
    statut: { courant: 'Courant en élevage', 'recherché': 'Recherché', rare: 'Rare', sauvage: 'Sauvage', 'protégé': 'Protégé ou menacé' },
    milieu: {
      foret: 'Forêt et litière', mediterraneen: 'Garrigue méditerranéenne', tropical: 'Forêt tropicale', littoral: 'Littoral',
      grotte: 'Grottes et karst', humide: 'Zones humides', desert: 'Désert', fourmiliere: 'Fourmilière', urbain: 'Jardins et habitations'
    },
    zone: { europe: 'Europe', mediterranee: 'Méditerranée', asie: 'Asie', ameriques: 'Amériques', afrique: 'Afrique', oceanie: 'Océanie', cosmopolite: 'Cosmopolite' }
  };

  const FAMILLES = {
    Armadillidiidae: { nom: 'Les armadilles', desc: "Cloportes bombés d'Europe et de Méditerranée, capables de se rouler en boule parfaite. Uropodes courts qui ferment la sphère.", roule: true },
    Porcellionidae: { nom: 'Les porcellions', desc: "Coureurs aplatis aux longs uropodes, incapables de se rouler. Le groupe le plus élevé, riche en géants ibériques.", roule: false },
    Armadillidae: { nom: 'Les boules tropicales', desc: "Cousines tropicales et méditerranéennes des armadilles, au telson en sablier. Elles comptent les Cubaris, stars de l'élevage.", roule: true },
    Oniscidae: { nom: 'Les onisques', desc: "Grands cloportes plats et brillants, au flagelle antennaire de trois articles.", roule: false },
    Philosciidae: { nom: 'Les philoscies', desc: "Coureurs élancés aux longues antennes, dont le pléon est nettement plus étroit que le péréion.", roule: false },
    Halophilosciidae: { nom: 'Les philoscies du littoral', desc: "Coureurs aux antennes très longues, liés aux rochers battus par les embruns.", roule: false },
    Trachelipodidae: { nom: 'Les trachélipes', desc: "Cloportes de taille moyenne, proches des Porcellio, qui respirent grâce à cinq paires de poumons pléopodaux.", roule: false },
    Agnaridae: { nom: 'Les agnaridés', desc: "Famille variée qui compte le cloporte du désert, Hemilepistus, célèbre pour sa vie de famille.", roule: false },
    Cylisticidae: { nom: 'Les cylisticidés', desc: "Capables d'une mise en boule imparfaite, les uropodes restant visibles.", roule: true },
    Platyarthridae: { nom: 'Les platyarthridés', desc: "Petits cloportes souvent aveugles et blancs, dont plusieurs vivent dans les fourmilières.", roule: false },
    Balloniscidae: { nom: 'Les balloniscidés', desc: "Famille propre à l'Amérique du Sud.", roule: false },
    Ligiidae: { nom: 'Les ligies', desc: "Lignée ancienne restée au contact de l'eau : grands yeux, antennes multi-articulées, uropodes fourchus.", roule: false },
    Tylidae: { nom: 'Les tylidés', desc: "Boules lisses des plages de sable, aux antennes minuscules. Le pléon se replie sous le corps.", roule: true },
    Trichoniscidae: { nom: 'Les trichoniscidés', desc: "La micro-faune de la litière : minuscules, souvent colorés de rose ou de pourpre, parfois cavernicoles et aveugles.", roule: false },
    Mesoniscidae: { nom: 'Les mésoniscidés', desc: "Une lignée très ancienne de cloportes aveugles des grottes et du sol profond.", roule: false },
    Buddelundiellidae: { nom: 'Les buddelundiellidés', desc: "Minuscules cloportes côtelés capables de se rouler.", roule: true },
    Detonidae: { nom: 'Les détonidés', desc: "Cloportes côtiers de l'hémisphère Sud, parfois épineux.", roule: false }
  };
  const FAMILY_ORDER = ['Armadillidiidae', 'Porcellionidae', 'Armadillidae', 'Oniscidae', 'Philosciidae', 'Halophilosciidae', 'Trachelipodidae', 'Agnaridae', 'Cylisticidae', 'Platyarthridae', 'Balloniscidae', 'Ligiidae', 'Tylidae', 'Trichoniscidae', 'Mesoniscidae', 'Buddelundiellidae', 'Detonidae'];

  /* ---------- Setups de terrarium ---------- */
  const SETUPS = [
    {
      id: 'setup-depart', nom: 'La boîte de départ', sous: 'Tempéré, polyvalent', niveau: 1,
      dims: '40 × 25 × 25 cm · environ 25 L', temp: '18 à 24 °C', hum: 'Gradient 60 → 80 %', vent: 'moyenne', gradient: true,
      desc: "Une boîte en plastique alimentaire, un substrat de forêt et un coin humide : la base qui convient à la majorité des espèces tempérées communes. On la monte en une heure pour moins de 20 euros.",
      layers: [{ mat: 'terreau', h: 4 }, { mat: 'bois', h: 2 }, { mat: 'humus', h: 2 }],
      items: [{ t: 'mousse', x: .1, w: .1 }, { t: 'liege', x: .02, w: .34 }, { t: 'feuilles', x: .35, w: .6 }, { t: 'seiche', x: .66 }, { t: 'gamelle', x: .86 }],
      recette: [{ mat: 'terreau', pct: 50 }, { mat: 'feuilles', pct: 20 }, { mat: 'bois', pct: 20 }, { mat: 'calcaire', pct: 10 }],
      etapes: [
        "Percez le couvercle sur un tiers de sa surface et collez-y une moustiquaire fine.",
        "Mélangez terreau sans engrais, feuilles broyées et bois blanc pourri émietté ; humidifiez jusqu'à ce qu'une poignée pressée ne goutte pas.",
        "Étalez 6 à 8 cm de substrat, un peu plus épais côté humide.",
        "Posez une écorce de liège à cheval sur la zone humide et une couche de feuilles entières sur tout le bac.",
        "Ajoutez un os de seiche et une coupelle pour la nourriture fraîche."
      ],
      entretien: ["Arrosez le coin humide deux fois par semaine.", "Retirez la nourriture fraîche après 48 heures.", "Rajoutez des feuilles dès que la couche s'amincit.", "Changez le substrat tous les 12 à 18 mois."],
      especes: ['armadillidium-vulgare', 'porcellio-scaber', 'armadillidium-nasatum', 'porcellio-dilatatus', 'trachelipus-rathkii', 'cylisticus-convexus', 'oniscus-asellus', 'porcellio-spatulatus', 'armadillidium-depressum']
    },
    {
      id: 'setup-garrigue', nom: 'Garrigue méditerranéenne', sous: 'Sec, chaud, très aéré', niveau: 2,
      dims: '60 × 30 × 30 cm · environ 50 L', temp: '20 à 27 °C', hum: 'Sec, un coin à 75 %', vent: 'forte', gradient: true, sideVent: true, slope: 1,
      desc: "Le bac des Porcellio espagnols, des armadilles de la côte adriatique et d'Armadillo officinalis. Sol drainant, pierres chaudes, air qui circule. L'humidité se limite à une poche sous l'écorce.",
      layers: [{ mat: 'argile', h: 3 }, { mat: 'sable', h: 3 }, { mat: 'terreau', h: 3 }, { mat: 'calcaire', h: 1 }],
      items: [{ t: 'liege', x: .02, w: .28 }, { t: 'mousse', x: .06, w: .06 }, { t: 'pierre', x: .5 }, { t: 'pierre', x: .78 }, { t: 'feuilles', x: .3, w: .5 }, { t: 'seiche', x: .92 }],
      recette: [{ mat: 'terreau', pct: 40 }, { mat: 'sable', pct: 30 }, { mat: 'argile', pct: 10 }, { mat: 'feuilles', pct: 10 }, { mat: 'calcaire', pct: 10 }],
      etapes: [
        "Découpez une grande fenêtre grillagée sur le couvercle et une seconde sur un petit côté : l'air doit traverser le bac.",
        "Posez au fond une couche d'argile tassée, puis le mélange terreau et sable ; parsemez de gravier calcaire.",
        "Donnez une pente au substrat : plus épais du côté humide.",
        "Enfouissez à moitié des pierres plates calcaires, puis une écorce sur la zone humide.",
        "Éclairez faiblement le côté sec (lampe basse consommation) pour créer un gradient de température."
      ],
      entretien: ["Humidifiez seulement sous l'écorce, une à deux fois par semaine.", "Feuilles sèches de chêne vert ou d'olivier en permanence.", "Protéines une fois par semaine."],
      especes: ['armadillidium-klugii', 'armadillidium-maculatum', 'armadillidium-gestroi', 'armadillidium-granulatum', 'porcellio-expansus', 'porcellio-hoffmannseggii', 'porcellio-magnificus', 'porcellio-bolivari', 'porcellio-ornatus', 'porcellio-haasi', 'armadillo-officinalis', 'porcellionides-sexfasciatus', 'armadillidium-espanyoli']
    },
    {
      id: 'setup-sous-bois', nom: 'Sous-bois humide', sous: 'Frais, riche en bois mort', niveau: 2,
      dims: '50 × 30 × 30 cm · environ 40 L', temp: '12 à 21 °C', hum: '70 à 85 %', vent: 'moyenne', gradient: true,
      desc: "Pour les espèces forestières qui vivent dans le bois pourri et la litière épaisse : onisques, philoscies, trachélipes, élumes. On y reproduit l'épaisseur d'un sol de hêtraie.",
      layers: [{ mat: 'terreau', h: 4 }, { mat: 'bois', h: 4 }, { mat: 'humus', h: 3 }, { mat: 'feuilles', h: 2 }],
      items: [{ t: 'mousse', x: .08, w: .14 }, { t: 'branche', x: .44 }, { t: 'liege', x: .6, w: .3 }, { t: 'feuilles', x: .2, w: .7 }, { t: 'seiche', x: .3 }],
      recette: [{ mat: 'terreau', pct: 35 }, { mat: 'bois', pct: 30 }, { mat: 'humus', pct: 20 }, { mat: 'feuilles', pct: 15 }],
      etapes: [
        "Utilisez du bois blanc (hêtre, chêne, bouleau) assez pourri pour s'effriter sous le doigt.",
        "Enfouissez de gros morceaux de bois dans la couche profonde : ils serviront de garde-manger et de cachette.",
        "Couvrez d'une épaisse couche de feuilles de hêtre et de chêne, puis de mousse prélevée sans produits.",
        "Placez le bac dans une pièce fraîche, loin des radiateurs."
      ],
      entretien: ["Arrosez le fond du substrat chaque semaine.", "Rajoutez du bois pourri tous les 2 à 3 mois.", "Surveillez les moisissures sur la nourriture."],
      especes: ['oniscus-asellus', 'philoscia-muscorum', 'philoscia-affinis', 'trachelipus-ratzeburgii', 'eluma-caelata', 'armadillidium-opacum', 'armadillidium-pictum', 'porcellio-monticola', 'porcellio-montanus', 'protracheoniscus-politus', 'trichoniscus-pusillus', 'armadillidium-peraccae', 'ligidium-hypnorum']
    },
    {
      id: 'setup-karst', nom: 'Karst tropical', sous: 'Humide et ventilé : le bac des Cubaris', niveau: 3,
      dims: '40 × 30 × 25 cm · environ 30 L', temp: '22 à 26 °C', hum: '75 à 90 %', vent: 'forte', gradient: true, sideVent: true,
      desc: "Les Cubaris et Merulanella vivent sur des massifs calcaires tropicaux, dans une humidité saturée mais un air qui circule. Le secret est de combiner les deux : sphaigne mouillée d'un côté, ventilation croisée, roches calcaires partout.",
      layers: [{ mat: 'coco', h: 3 }, { mat: 'bois', h: 3 }, { mat: 'calcaire', h: 1 }, { mat: 'sphaigne', h: 1 }],
      items: [{ t: 'mousse', x: .06, w: .16 }, { t: 'pierre', x: .36 }, { t: 'liege', x: .5, w: .26 }, { t: 'pierre', x: .86 }, { t: 'feuilles', x: .3, w: .6 }, { t: 'seiche', x: .66 }],
      recette: [{ mat: 'coco', pct: 30 }, { mat: 'bois', pct: 30 }, { mat: 'feuilles', pct: 20 }, { mat: 'calcaire', pct: 10 }, { mat: 'sphaigne', pct: 10 }],
      etapes: [
        "Percez deux côtés opposés et couvrez-les de grillage fin pour créer une ventilation croisée.",
        "Substrat de fibre de coco, bois blanc pourri et feuilles de chêne ou de catappa ; ajoutez des éclats de calcaire.",
        "Tapissez le tiers humide de sphaigne vivante, maintenue mouillée.",
        "Disposez des roches calcaires poreuses et de l'écorce de liège.",
        "Placez le bac dans une pièce stable à 23 à 25 °C, sans chauffage direct."
      ],
      entretien: ["Mouillez la sphaigne tous les deux jours.", "Retirez toute nourriture moisie immédiatement.", "Ne touchez pas les colonies plus d'une fois par mois : ces espèces sont lentes et discrètes."],
      especes: ['cubaris-rubber-ducky', 'cubaris-amber-ducky', 'cubaris-panda-king', 'cubaris-jupiter', 'cubaris-lemon-blue', 'ardentiella-caerulea', 'cubaris-red-edge', 'cubaris-white-shark', 'merulanella-ember-bee', 'cubaris-murina']
    },
    {
      id: 'setup-bioactif', nom: 'Vivarium bioactif', sous: 'Les cloportes comme équipe de nettoyage', niveau: 1,
      dims: '45 × 45 × 60 cm · vivarium tropical', temp: '22 à 28 °C', hum: '80 à 90 %', vent: 'moyenne', gradient: false,
      desc: "Dans un vivarium planté pour grenouilles ou geckos, de petites espèces de cloportes consomment déjections, moisissures et feuilles mortes. Associées aux collemboles, elles forment un écosystème qui s'entretient presque seul.",
      layers: [{ mat: 'drainage', h: 3 }, { mat: 'terreau', h: 6 }, { mat: 'feuilles', h: 2 }],
      items: [{ t: 'plante', x: .22 }, { t: 'branche', x: .45 }, { t: 'mousse', x: .1, w: .12 }, { t: 'eau', x: .8 }, { t: 'feuilles', x: .3, w: .4 }],
      recette: [{ mat: 'terreau', pct: 40 }, { mat: 'coco', pct: 20 }, { mat: 'bois', pct: 20 }, { mat: 'sphaigne', pct: 10 }, { mat: 'feuilles', pct: 10 }],
      etapes: [
        "Installez une couche drainante (billes d'argile) séparée du substrat par une toile.",
        "Posez 6 à 8 cm de substrat tropical riche en matière organique.",
        "Plantez, décorez, puis couvrez le sol de feuilles de chêne ou de catappa.",
        "Introduisez collemboles et cloportes deux à quatre semaines avant les animaux principaux."
      ],
      entretien: ["Renouvelez la couche de feuilles tous les mois.", "Nourrissez les cloportes d'un peu de légumes si le vivarium est très propre."],
      especes: ['trichorhina-tomentosa', 'nagurus-cristatus', 'venezillo-parvus', 'atlantoscia-floridana', 'cubaris-murina', 'porcellionides-pruinosus', 'reductoniscus-costulatus']
    },
    {
      id: 'setup-littoral', nom: 'Laisse de mer', sous: 'Sable, bois flotté et embruns', niveau: 3,
      dims: '50 × 30 × 30 cm · environ 40 L', temp: '12 à 24 °C', hum: 'Sable humide au fond', vent: 'forte', gradient: true, sideVent: true,
      desc: "Un milieu d'experts pour les espèces des hauts de plage. Le sable doit être humide en profondeur et sec en surface, avec des débris échoués comme nourriture. La plupart de ces espèces restent à observer dans la nature.",
      layers: [{ mat: 'sable', h: 8 }, { mat: 'calcaire', h: 1 }],
      items: [{ t: 'branche', x: .1 }, { t: 'coquillage', x: .5 }, { t: 'coquillage', x: .58 }, { t: 'feuilles', x: .6, w: .3 }, { t: 'pierre', x: .82 }],
      recette: [{ mat: 'sable', pct: 80 }, { mat: 'calcaire', pct: 10 }, { mat: 'feuilles', pct: 10 }],
      etapes: [
        "Rincez abondamment du sable de mer pour retirer l'excès de sel.",
        "Humidifiez uniquement la couche du fond en versant de l'eau par un tube enfoncé dans un coin.",
        "Ajoutez du bois flotté, des coquillages et des algues séchées."
      ],
      entretien: ["Contrôlez l'humidité du fond au doigt chaque semaine.", "Renouvelez les algues sèches."],
      especes: ['armadillidium-album', 'porcellio-lamellatus', 'tylos-europaeus', 'armadillidium-granulatum', 'porcellionides-cingendus']
    },
    {
      id: 'setup-terrier', nom: 'Terrier du désert', sous: 'Argile compacte et nuits fraîches', niveau: 3,
      dims: '40 × 20 × 40 cm · bac haut', temp: '20 à 32 °C le jour', hum: 'Sec en surface, frais en profondeur', vent: 'forte', gradient: false, sideVent: true,
      desc: "Pour les espèces fouisseuses des milieux arides. Une couche d'argile sableuse compacte et profonde permet de creuser des terriers verticaux où l'humidité se maintient.",
      layers: [{ mat: 'argile', h: 14 }, { mat: 'sable', h: 4 }],
      items: [{ t: 'pierre', x: .3 }, { t: 'pierre', x: .72 }],
      recette: [{ mat: 'argile', pct: 60 }, { mat: 'sable', pct: 35 }, { mat: 'calcaire', pct: 5 }],
      etapes: [
        "Tassez par couches successives un mélange humide d'argile et de sable sur 18 à 20 cm.",
        "Laissez sécher la surface plusieurs jours avant d'introduire les animaux.",
        "Humidifiez le fond par un tube vertical, jamais la surface."
      ],
      entretien: ["Alternance jour chaud et nuit fraîche.", "Débris végétaux secs déposés en surface."],
      especes: ['hemilepistus-reaumuri', 'venezillo-arizonicus', 'leptotrichus-panzerii', 'trachelipus-nodulosus']
    }
  ];

  /* ---------- Guide par niveau ---------- */
  const NIVEAUX = [
    {
      n: 1, titre: 'Débutant', accroche: "Vos premiers cloportes",
      intro: "Les cloportes sont parmi les animaux les plus faciles à maintenir. Il suffit de comprendre trois choses : ils respirent par des poumons fragiles qui doivent rester humides, ils mangent surtout des feuilles mortes, et ils ont besoin de calcium pour muer. Tout le reste est du détail.",
      checklist: [
        "Une boîte en plastique de 20 à 30 litres avec un couvercle aéré",
        "Du terreau sans engrais ni billes d'engrais",
        "Des feuilles mortes de chêne, hêtre ou charme, séchées",
        "Du bois blanc pourri (hêtre, chêne, bouleau)",
        "Un os de seiche ou de la craie",
        "Un vaporisateur ou un petit arrosoir",
        "10 à 20 individus d'une espèce débutante"
      ],
      topics: [
        { t: 'Le gradient d\'humidité', d: "C'est le point le plus important. Gardez un côté du bac humide et l'autre sec : les cloportes choisissent eux-mêmes où se placer. Un bac détrempé partout provoque des mortalités, un bac sec partout aussi." },
        { t: 'La nourriture', d: "Les feuilles mortes sont la base : laissez-en toujours une couche. Complétez deux fois par semaine avec des légumes (courgette, carotte, concombre) et une fois par semaine avec des protéines (flocons de poisson, granulés pour crevettes)." },
        { t: 'Le calcium', d: "La cuticule des cloportes est chargée de carbonate de calcium. Un os de seiche posé en permanence, ou de la craie, évite les mues ratées." },
        { t: 'Observer une mue', d: "Un cloporte à moitié blanc n'est pas malade : il mue en deux temps, d'abord l'arrière puis l'avant. Ne le touchez pas, il est très vulnérable pendant un à deux jours." },
        { t: 'Où placer le bac', d: "À température ambiante, entre 18 et 24 °C, à l'abri du soleil direct et des radiateurs. Une étagère dans une pièce calme est parfaite." },
        { t: 'Les premiers bébés', d: "Après quelques semaines, vous verrez des jeunes blancs d'un à deux millimètres. Ce sont des mancas : ils n'ont que six paires de pattes et acquièrent la septième à la mue suivante." }
      ],
      erreurs: ["Arroser tout le bac chaque jour.", "Utiliser du terreau avec engrais ou du bois résineux frais.", "Laisser pourrir la nourriture fraîche plus de deux jours.", "Oublier le calcium."]
    },
    {
      n: 2, titre: 'Intermédiaire', accroche: "Maîtriser les microclimats",
      intro: "Une fois les bases acquises, on aborde les espèces qui demandent un milieu plus précis : les armadilles méditerranéennes, les grands Porcellio ou les espèces forestières fraîches. L'enjeu devient la gestion fine de l'humidité, de l'aération et des saisons.",
      checklist: [
        "Un thermomètre-hygromètre min/max",
        "Des bacs de tailles différentes selon les espèces",
        "Du sable, du gravier calcaire et de l'argile pour ajuster les substrats",
        "Des collemboles comme équipe de nettoyage",
        "Un carnet d'élevage (dates d'arrivée, naissances, pertes)",
        "Une loupe de terrain ×10"
      ],
      topics: [
        { t: 'Aération croisée', d: "Pour les espèces de milieux secs, une seule grille sur le couvercle ne suffit pas. Deux ouvertures sur des faces opposées créent un courant d'air qui évite l'humidité stagnante, cause principale des pertes." },
        { t: 'Les protéines', d: "Les espèces actives ou de grande taille ont besoin de protéines : leur manque entraîne du cannibalisme sur les individus en mue. Variez les sources : flocons de poisson, vers de farine séchés, spiruline." },
        { t: 'Hivernage', d: "Beaucoup d'espèces européennes se reproduisent mieux après un hiver frais. Deux à trois mois entre 10 et 15 °C, avec moins de nourriture, synchronisent les naissances au printemps." },
        { t: 'Collemboles et acariens', d: "Les collemboles consomment moisissures et restes : ce sont vos alliés. Les acariens blancs qui pullulent signalent un excès d'humidité ou de nourriture ; réduisez les deux." },
        { t: 'Sélection de morphes', d: "Pour maintenir une forme colorée, retirez à chaque génération les individus qui s'éloignent du phénotype recherché. Isolez les lignées dans des bacs séparés et étiquetés." },
        { t: 'Gérer la densité', d: "Une colonie trop dense ralentit sa reproduction et favorise les parasites. Divisez-la en deux bacs dès que les cloportes sont visibles en permanence en surface le jour." }
      ],
      erreurs: ["Mélanger plusieurs espèces ou morphes dans le même bac.", "Confondre humidité et confinement.", "Ignorer les saisons des espèces tempérées.", "Acheter trop peu d'individus d'une espèce lente."]
    },
    {
      n: 3, titre: 'Expert', accroche: "Espèces rares et lignées fragiles",
      intro: "Les Cubaris thaïlandais, les géants ibériques, les espèces sociales ou littorales demandent de reproduire un climat précis et de gérer des populations petites et lentes. L'éleveur expert devient aussi un conservateur : il documente, partage et préserve des lignées.",
      checklist: [
        "Une pièce à température stable, ou un meuble dédié",
        "Des données climatiques de la localité d'origine",
        "Plusieurs bacs de sauvegarde par lignée",
        "Des étiquettes avec espèce, localité, origine et date",
        "Un réseau d'éleveurs pour échanger et brasser les lignées"
      ],
      topics: [
        { t: 'Reproduire un climat', d: "Consultez les normales climatiques de la région d'origine : températures jour et nuit, saison sèche, saison des pluies. Les espèces de karst tropical supportent mal la chaleur au-delà de 27 °C, alors que les espèces ibériques ont besoin d'étés chauds et d'hivers frais." },
        { t: 'Humidité et ventilation', d: "Le paradoxe des Cubaris : une humidité proche de la saturation, mais un air qui circule en permanence. Sphaigne mouillée d'un côté, grilles sur deux faces opposées, jamais de condensation continue sur les parois." },
        { t: 'Consanguinité', d: "Une lignée fondée sur quelques individus perd sa vigueur au fil des générations : portées plus petites, mues difficiles. Divisez les colonies en sous-groupes et échangez des individus entre éleveurs de la même localité." },
        { t: 'Sauvegarde', d: "Ne gardez jamais une espèce rare dans un seul bac. Un coup de chaleur, une infestation ou une erreur d'arrosage peuvent tout effacer. Deux ou trois bacs indépendants sont la règle." },
        { t: 'Espèces sociales', d: "Hemilepistus reaumuri vit en couples qui élèvent leurs petits dans un terrier. Chaque famille doit disposer de son propre bac, avec un sol argileux assez profond pour creuser." },
        { t: 'Éthique', d: "Ne prélevez jamais d'espèces protégées, cavernicoles ou endémiques. Étiquetez vos animaux avec leur localité d'origine et ne croisez pas les localités : c'est ce qui donne leur valeur scientifique aux élevages." }
      ],
      erreurs: ["Garder une espèce rare dans un seul bac.", "Chauffer un bac de Cubaris au-delà de 27 °C.", "Croiser des localités différentes.", "Déranger trop souvent des colonies lentes."]
    }
  ];

  const PROBLEMES = [
    { q: "Mes cloportes meurent pendant la mue", r: "Une mue ratée vient presque toujours d'un manque de calcium ou d'une humidité insuffisante. Vérifiez qu'un os de seiche est disponible et que le coin humide ne s'assèche jamais complètement. Un individu à moitié mué qui reste bloqué plusieurs jours ne survit en général pas." },
    { q: "Des acariens blancs envahissent le bac", r: "Ce sont en général des acariens détritivores inoffensifs, signe d'un excès de nourriture ou d'humidité. Retirez les restes, laissez sécher légèrement la surface et ajoutez des collemboles. Un morceau de pomme de terre posé une nuit les attire : retirez-le couvert d'acariens. Les acariens rouges ou bruns très rapides qui attaquent les cloportes sont plus rares et plus préoccupants." },
    { q: "De petites mouches volent autour du bac", r: "Sciarides et phorides pondent dans la nourriture en décomposition. Réduisez les légumes, retirez-les plus tôt, et placez une bande de moustiquaire fine sous le couvercle. Un piège à vinaigre de cidre à proximité limite les adultes." },
    { q: "Une odeur d'ammoniaque se dégage", r: "Les cloportes rejettent leurs déchets azotés sous forme d'ammoniac gazeux. Une odeur forte signale un bac surpeuplé ou mal aéré, avec une accumulation de déjections. Augmentez l'aération, divisez la colonie et renouvelez une partie du substrat." },
    { q: "La colonie ne se reproduit pas", r: "Vérifiez la température (trop fraîche ou trop chaude), la présence des deux sexes, l'accès aux protéines et au calcium. Beaucoup d'espèces tempérées ont besoin d'un hiver frais puis d'un réchauffement printanier. Les espèces rares peuvent simplement demander six mois à un an d'installation." },
    { q: "Un cloporte est devenu bleu violet", r: "Une couleur bleue irisée intense est souvent le signe d'une infection par un iridovirus. L'animal meurt en général en quelques semaines. Isolez-le et surveillez la colonie ; la transmission se fait surtout par cannibalisme sur les individus malades." },
    { q: "Des moisissures blanches couvrent la nourriture", r: "C'est normal sur les légumes après un ou deux jours dans un milieu humide. Retirez-les, réduisez les portions et ajoutez des collemboles. Les filaments blancs sur le bois pourri font en revanche partie du régime des cloportes." },
    { q: "Ils s'échappent", r: "Les cloportes grimpent le long des angles et passent par des interstices d'un millimètre. Collez une moustiquaire sur les aérations, vérifiez l'ajustement du couvercle et ne laissez pas de décor toucher le haut du bac." }
  ];

  /* ---------- Anatomie ---------- */
  const ANATOMIE = {
    dorsal: [
      { id: 'antennes', nom: 'Antennes', sci: 'Antennae II', anchor: 'antenna', txt: "La seconde paire d'antennes, bien visible, est l'organe principal du toucher et de l'odorat. Elle se termine par un flagelle dont le nombre d'articles sert à l'identification : deux chez Porcellio et Armadillidium, trois chez Oniscus et Philoscia, de nombreux chez Ligia." },
      { id: 'antennules', nom: 'Antennules', sci: 'Antennae I', anchor: 'antennule', txt: "La première paire d'antennes est réduite à de minuscules appendices portant des récepteurs chimiques. Chez les crustacés marins, elle est bien développée." },
      { id: 'yeux', nom: 'Yeux composés', sci: 'Oculi', anchor: 'eye', txt: "Formés de quelques ommatidies à plus d'une vingtaine selon les espèces, ils perçoivent surtout la lumière et les ombres. Les espèces cavernicoles et fouisseuses les ont perdus." },
      { id: 'cephalon', nom: 'Céphalon', sci: 'Cephalon', anchor: 'head', txt: "La tête est soudée au premier segment thoracique. Elle porte les antennes, les yeux et les pièces buccales. Chez les armadilles, un bouclier frontal ferme la boule quand l'animal se roule." },
      { id: 'pereion', nom: 'Péréion', sci: 'Pereon', anchor: 'pereon', txt: "Le thorax compte sept segments, les péréionites, chacun protégé par une plaque dorsale, le tergite. C'est la partie la plus large du corps." },
      { id: 'epimeres', nom: 'Épimères', sci: 'Epimera', anchor: 'epimeron', txt: "Les expansions latérales des tergites forment une jupe qui protège les pattes et limite les pertes d'eau. Leur forme, arrondie ou pointue, est un bon critère d'identification." },
      { id: 'pattes', nom: 'Péréiopodes', sci: 'Pereopoda', anchor: 'leg', txt: "Sept paires de pattes marcheuses, toutes semblables, d'où le nom d'isopode (« pieds égaux »). Chez certaines espèces, des sillons capillaires sur les pattes conduisent l'eau vers l'arrière du corps." },
      { id: 'pleon', nom: 'Pléon', sci: 'Pleon', anchor: 'pleon', txt: "L'abdomen compte cinq petits segments. Il porte dessous les pléopodes, organes de la respiration et, chez le mâle, de la reproduction." },
      { id: 'telson', nom: 'Pléotelson', sci: 'Pleotelson', anchor: 'telson', txt: "Dernier segment, soudé au telson. Triangulaire chez Porcellio, trapézoïdal chez Armadillidium, en sablier chez les Armadillidae." },
      { id: 'uropodes', nom: 'Uropodes', sci: 'Uropoda', anchor: 'uropod', txt: "La dernière paire d'appendices. Longs chez les coureurs, courts et affleurants chez les espèces qui se roulent. Certaines espèces y possèdent des glandes défensives ou s'en servent pour absorber de l'eau." }
    ],
    ventral: [
      { id: 'bouche', nom: 'Pièces buccales', sci: 'Mandibulae, maxillae', anchor: 'mouth', txt: "Mandibules et maxilles broient les feuilles et le bois. Les cloportes pratiquent aussi la coprophagie : ils consomment leurs excréments pour récupérer le cuivre et les micro-organismes utiles." },
      { id: 'sternites', nom: 'Dépôts calciques', sci: 'Sternal deposits', anchor: 'sternal', txt: "Avant la mue, le calcium de la moitié arrière du corps est stocké sous forme de plaques blanches sur les sternites antérieurs. Ces taches visibles dessous annoncent une mue imminente." },
      { id: 'marsupium', nom: 'Marsupium', sci: 'Marsupium', anchor: 'marsupium', txt: "Chez la femelle, des lamelles (oostégites) forment une poche ventrale remplie de liquide où les œufs se développent. Les jeunes en sortent déjà formés, après quelques semaines." },
      { id: 'pleopodes', nom: 'Pléopodes', sci: 'Pleopoda', anchor: 'pleopod', txt: "Cinq paires de plaques sous le pléon. L'endopodite, fin, assure les échanges gazeux en milieu humide ; l'exopodite, plus rigide, le protège. Chez le mâle, les deux premières paires sont modifiées pour l'accouplement." },
      { id: 'poumons', nom: 'Poumons pléopodaux', sci: 'Pseudotracheae', anchor: 'lung', txt: "Les taches blanches sur les premiers pléopodes des Porcellio et Armadillidium sont des poumons : des tubules ramifiés remplis d'air. Ils ont permis aux cloportes de coloniser les milieux secs." },
      { id: 'pattes-v', nom: 'Péréiopodes', sci: 'Pereopoda', anchor: 'leg', txt: "Vus de dessous, les sept paires de pattes sont bien visibles. Chaque patte compte sept articles ; les jeunes à la naissance n'en ont que six paires." }
    ]
  };

  const CYCLE = [
    { k: 'Accouplement', d: "Le mâle monte sur le dos de la femelle et transfère son sperme, qu'elle peut conserver et utiliser pour plusieurs pontes.", t: 'Printemps, été' },
    { k: 'Marsupium', d: "La femelle mue sa moitié ventrale, développe sa poche et y dépose ses œufs. Ils y restent environ trois à six semaines selon la température.", t: '3 à 6 semaines' },
    { k: 'Mancas', d: "Les jeunes sortent blancs et translucides, avec six paires de pattes seulement. Ils restent quelques heures près de la mère.", t: 'Naissance' },
    { k: 'Juvéniles', d: "Ils muent toutes les deux à quatre semaines, acquièrent la septième paire de pattes puis leur couleur au fil des mues.", t: '3 à 12 mois' },
    { k: 'Adultes', d: "La croissance ralentit mais les mues continuent toute la vie, environ une fois par mois. Les femelles produisent une à plusieurs portées par an.", t: '2 à 5 ans' }
  ];

  const ADAPTATIONS = [
    { t: 'La mue en deux temps', d: "Les cloportes muent d'abord la moitié arrière, puis la moitié avant quelques heures à quelques jours plus tard. Ils restent ainsi en partie protégés, et le calcium passe d'une moitié à l'autre.", icon: 'molt' },
    { t: 'La conglobation', d: "Se rouler en boule protège des prédateurs et réduit les pertes d'eau. Cette capacité est apparue plusieurs fois indépendamment chez les armadilles, les Armadillidae et les Tylidae.", icon: 'ball' },
    { t: 'Respirer l\'air', d: "Les poumons pléopodaux, des tubules blancs sous l'abdomen, permettent aux espèces les plus évoluées de vivre dans des milieux secs. Les espèces primitives respirent encore par des branchies humides.", icon: 'lung' },
    { t: 'Un sang bleu', d: "Comme chez les crabes, l'oxygène est transporté par l'hémocyanine, une protéine à base de cuivre. D'où l'importance de la coprophagie pour recycler ce métal rare.", icon: 'blood' },
    { t: 'Uriner de l\'ammoniac gazeux', d: "Plutôt que de perdre de l'eau à éliminer leurs déchets azotés, les cloportes les rejettent sous forme d'ammoniac qui s'évapore à travers la cuticule.", icon: 'gas' },
    { t: 'Grégarisme', d: "Les cloportes se regroupent en agrégats serrés qui limitent l'évaporation de chacun. Ils se reconnaissent à l'odeur de leurs congénères.", icon: 'group' }
  ];

  const GLOSSAIRE = [
    ['Oniscidea', "Sous-ordre des isopodes qui regroupe l'ensemble des cloportes terrestres."],
    ['Isopode', "Crustacé aux pattes toutes semblables. L'ordre compte aussi des espèces marines et d'eau douce."],
    ['Conglobation', "Capacité à se rouler en boule."],
    ['Manca', "Jeune cloporte à la sortie du marsupium, avec six paires de pattes."],
    ['Marsupium', "Poche ventrale où la femelle incube ses œufs."],
    ['Oostégite', "Lamelle qui forme la paroi du marsupium."],
    ['Tergite', "Plaque dorsale d'un segment."],
    ['Épimère', "Expansion latérale d'un tergite."],
    ['Pléotelson', "Dernier segment du corps, fusion du sixième pléonite et du telson."],
    ['Pléopode', "Appendice abdominal, respiratoire et reproducteur."],
    ['Uropode', "Dernière paire d'appendices, de part et d'autre du telson."],
    ['Flagelle', "Partie terminale articulée de l'antenne."],
    ['Morphe', "Forme de couleur sélectionnée en élevage (Orange, Calico, Dalmatian…)."],
    ['Localité', "Lieu d'origine précis d'une population, à conserver séparément en élevage."],
    ['Parthénogenèse', "Reproduction sans mâle, où les femelles produisent des femelles."],
    ['Bioactif', "Terrarium où une microfaune (cloportes, collemboles) recycle les déchets."],
    ['Collembole', "Minuscule hexapode sauteur, allié des éleveurs contre les moisissures."],
    ['Myrmécophile', "Animal qui vit dans les fourmilières."],
    ['Hémocyanine', "Pigment respiratoire à base de cuivre, qui donne une teinte bleutée au sang."],
    ['Coprophagie', "Consommation de ses propres excréments pour en récupérer les nutriments."]
  ];

  const TAXO = [
    ['Règne', 'Animalia'], ['Embranchement', 'Arthropoda'], ['Sous-embranchement', 'Crustacea'], ['Classe', 'Malacostraca'],
    ['Super-ordre', 'Peracarida'], ['Ordre', 'Isopoda'], ['Sous-ordre', 'Oniscidea']
  ];

  /* ---------- Se procurer des cloportes en France ---------- */
  const ACHAT = {
    intro: "La plupart des espèces communes coûtent moins qu'un sachet de nourriture pour chat, et plusieurs vivent déjà dans votre jardin. Les espèces rares, elles, s'achètent auprès d'éleveurs spécialisés et peuvent dépasser 10 € l'individu.",
    sources: [
      { t: 'Votre jardin', d: "Porcellio scaber, Armadillidium vulgare, Oniscus asellus : quelques individus prélevés sous une pierre ou dans le compost suffisent pour démarrer, gratuitement." },
      { t: 'Boutiques en ligne françaises', d: "De nombreuses boutiques spécialisées vendent des lots de 10 individus nés en captivité, de 6 à 20 € pour les espèces courantes, avec un envoi en colis express." },
      { t: 'Bourses aux reptiles et insectes', d: "Les bourses régionales réunissent des éleveurs amateurs : prix souvent plus bas, animaux vus avant l'achat et conseils de vive voix." },
      { t: 'Échanges entre éleveurs', d: "Forums et groupes d'éleveurs échangent volontiers leurs surplus. C'est aussi le meilleur moyen de brasser des lignées rares." }
    ],
    conseils: [
      "Commandez au printemps ou en automne : les envois par temps de gel ou de canicule sont risqués.",
      "Préparez le bac avant la livraison et installez les cloportes dès réception.",
      "Achetez au moins 10 individus, davantage pour les espèces lentes, afin d'avoir les deux sexes.",
      "Préférez les animaux nés en captivité et demandez la localité d'origine pour les espèces rares.",
      "Les prix indiqués sur ce site ont été relevés en 2025-2026 dans des boutiques françaises : ils varient selon les naissances et les vendeurs."
    ],
    regles: [
      "Ne prélevez que des espèces communes, en petit nombre, et jamais dans une réserve naturelle ni dans une grotte.",
      "Ne relâchez jamais un cloporte exotique ou acheté dans la nature : il pourrait s'installer et concurrencer la faune locale.",
      "Les espèces protégées ou menacées (marais, dunes, grottes) ne se prélèvent pas, même en petit nombre."
    ]
  };

  const VEDETTES = ['cubaris-rubber-ducky', 'armadillidium-klugii', 'porcellio-laevis', 'cubaris-panda-king', 'armadillidium-maculatum', 'merulanella-ember-bee', 'porcellio-expansus', 'hemilepistus-reaumuri', 'porcellio-magnificus', 'cubaris-jupiter'];

  window.CONTENT = { LABELS, FAMILLES, FAMILY_ORDER, SETUPS, NIVEAUX, PROBLEMES, ANATOMIE, CYCLE, ADAPTATIONS, GLOSSAIRE, TAXO, VEDETTES, ACHAT };
})();

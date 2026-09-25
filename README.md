# Oniscidea — l'encyclopédie des cloportes

Site encyclopédique consacré aux cloportes (isopodes terrestres, sous-ordre des Oniscidea) :
100 espèces documentées, anatomie interactive, guide d'élevage par niveau et setups de terrarium.

## Contenu

- **100 fiches espèces** réparties en 17 familles : habitat, comportement, régime, anatomie,
  reproduction, fiche technique d'élevage, terrarium conseillé, conseils, erreurs à éviter,
  morphes de couleur et anecdote.
- **Anatomie** : planche interactive (face dorsale et ventrale), cycle de vie, adaptations à la vie
  terrestre, glossaire et classification.
- **Guide d'élevage** en trois niveaux (débutant, intermédiaire, expert), menu alimentaire et
  dépannage des problèmes courants.
- **Terrariums** : sept montages avec coupe cotée des couches de substrat, recette, étapes de
  montage, entretien et espèces adaptées.

Toutes les illustrations sont générées en SVG à partir des caractéristiques de chaque espèce
(morphologie, couleurs, motifs) : aucune image externe n'est nécessaire.

## Lancer le site

Aucune dépendance ni étape de compilation. Ouvrez `index.html` dans un navigateur, ou servez le
dossier avec n'importe quel serveur statique :

```sh
python3 -m http.server 8000
```

Le site fonctionne tel quel sur GitHub Pages (Settings → Pages → branche et dossier racine).

## Structure

```
index.html                  coquille de la page (en-tête, pied de page)
css/style.css               styles, thèmes clair et sombre
js/draw.js                  moteur d'illustration SVG (cloportes, scène, planches, terrariums)
js/content.js               contenus éditoriaux (familles, guides, setups, anatomie, glossaire)
js/app.js                   routeur par ancre et rendu des vues
js/data/species-*.js        les 100 espèces, une fiche par objet
```

## Ajouter une espèce

Ajoutez un objet dans l'un des fichiers `js/data/species-*.js` en reprenant les champs d'une fiche
existante. Le champ `look` décrit l'illustration :

- `shape` : `armadillidium`, `cubaris`, `porcellio`, `oniscus`, `philoscia`, `ligia`,
  `trichoniscus`, `tylos` ou `agnarid` ;
- `c1`, `c2`, `c3` : couleur de fond, couleur du motif, couleur secondaire ;
- `pat` : un ou plusieurs motifs parmi `spots`, `edge`, `stripes`, `bands`, `dorsal`, `lines`,
  `marble`, `dalmatian`, `speckle`, `tubercles`, `ribs`, `blotch`, `band-rear`, `spikes`.

Les niveaux vont de 1 (débutant) à 3 (expert) ; 0 signale une espèce à observer dans la nature
plutôt qu'à élever.

## Avertissement

Les paramètres d'élevage sont des moyennes issues de la pratique des éleveurs. Les aires de
répartition des formes « sp. » du commerce restent indicatives. Ne prélevez jamais d'espèces
protégées, cavernicoles ou endémiques dans la nature.

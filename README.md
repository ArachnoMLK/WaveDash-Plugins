# WaveDash-Plugins

Catalogue officiel des plugins [WaveDash](https://github.com/ArachnoMLK/WaveDash). WaveDash lit `index.json` sur ce dépôt et propose ces plugins dans **Plugins › Catalogue**.

## Sécurité

- WaveDash ne lit que **ce** dépôt (adresse écrite dans l'application, non modifiable).
- `index.json` est **signé** (Ed25519, fichier `index.json.sig`). WaveDash contient la clé publique (`catalog-public.pem`) et refuse un index qui n'est pas signé par la clé privée du propriétaire. Cette clé n'est jamais dans le dépôt : même quelqu'un qui pourrait écrire ici ne pourrait pas publier de plugin.
- Chaque paquet `.wdsh` est vérifié par son empreinte SHA-256 (dans l'index signé) avant installation ; un fichier différent est refusé.
- L'installation affiche toujours les permissions demandées. Une mise à jour n'est automatique que si les permissions sont identiques.
- Les plugins s'exécutent dans le bac à sable de WaveDash (QuickJS, réseau limité aux domaines déclarés, un dossier en lecture seule). Voir [docs/PLUGINS.md](https://github.com/ArachnoMLK/WaveDash/blob/main/docs/PLUGINS.md).
- Toute contribution passe par une pull request relue par le propriétaire du dépôt.

## Ajouter ou mettre à jour un plugin

1. Un dossier `plugins/<nom>/` avec `manifest.json` et le script (`main.js`). Incrémente `version` à chaque changement.
2. `node tools/build.mjs` : empaquette `packages/<id>-<version>.wdsh`, met à jour `index.json` et le signe. La clé privée est lue dans `../wavedash-catalog-private.pem` (ou `WAVEDASH_CATALOG_KEY`) : seul le propriétaire du dépôt peut donc publier ; une pull request est fusionnée puis signée par lui.
3. Commit des trois (sources, paquet, index), puis pull request. L'action **Check** refuse un index qui ne correspond pas aux sources.

## Licence

MIT

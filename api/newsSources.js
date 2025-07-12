// Fichier : api/newsSources.js
// Version ES6 pure avec export nommé

// Sources d'actualités avec leurs orientations et URLs
export const newsSources = [
    // === GENERALISTES ===
    { name: "France Info", url: "https://www.francetvinfo.fr/titres.rss", orientation: "centre", category: "généraliste" },
    { name: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml", orientation: "centre-gauche", category: "généraliste" },
    { name: "Libération", url: "https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml", orientation: "gauche", category: "généraliste" },
    { name: "Le Figaro", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml", orientation: "droite", category: "généraliste" },
    { name: "Le Parisien", url: "https://feeds.leparisien.fr/leparisien/rss", orientation: "centre-droit", category: "généraliste" },
    { name: "Ouest France", url: "https://www.ouest-france.fr/rss-en-continu.xml", orientation: "centre", category: "régional" },
    { name: "Courrier International", url: "https://www.courrierinternational.com/feed/all/rss.xml", orientation: "centre-gauche", category: "international" },
    { name: "France Inter", url: "https://www.radiofrance.fr/franceinter/rss", orientation: "centre-gauche", category: "radio" },
    { name: "France24", url: "https://www.france24.com/fr/france/rss", orientation: "centre-gauche", category: "international" },
    { name: "L'Obs", url: "https://www.nouvelobs.com/rss.xml", orientation: "centre-gauche", category: "généraliste" },
    { name: "Euronews", url: "https://fr.euronews.com/rss", orientation: "centre", category: "international" },

    // === RÉGIONALES ===
    { name: "La Depeche", url: "https://www.ladepeche.fr/rss.xml", orientation: "centre-gauche", category: "régional" },
    { name: "Sud Ouest", url: "https://www.sudouest.fr/rss.xml", orientation: "centre-gauche", category: "régional" },
    { name: "La Republique des Pyrenees", url: "https://www.larepubliquedespyrenees.fr/rss.xml", orientation: "centre-gauche", category: "régional" },
    { name: "La Semaine des Pyrénées", url: "https://www.lasemainedespyrenees.fr/feed", orientation: "centre", category: "régional" },
    { name: "Corse Net Infos", url: "https://www.corsenetinfos.corsica/xml/syndication.rss", orientation: "neutre", category: "régional" },

    // === LA PRESSE (Canada) ===
    { name: "La Presse", url: "https://www.lapresse.ca/actualites/rss", orientation: "centre", category: "international" },
    { name: "Radio-Canada", url: "https://ici.radio-canada.ca/rss/4159", orientation: "centre", category: "international" },
    { name: "Le Devoir", url: "https://www.ledevoir.com/rss/manchettes.xml", orientation: "gauche", category: "international" },
    { name: "Journal de Montréal", url: "https://www.journaldemontreal.com/rss.xml", orientation: "droite", category: "international" },

    // === SOURCES OFFICIELLES & PARLEMENTAIRES ===
    { name: "Sénat (Textes)", url: "https://www.senat.fr/rss/textes.xml", orientation: "gouvernement", category: "officiel" },
    { name: "Sénat (Presse)", url: "https://www.senat.fr/rss/presse.xml", orientation: "gouvernement", category: "officiel" },
    { name: "Assemblée Nat. (Docs)", url: "https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires", orientation: "gouvernement", category: "officiel" },
    { name: "Assemblée Nat. (CRs)", url: "https://www2.assemblee-nationale.fr/feeds/detail/crs", orientation: "gouvernement", category: "officiel" },

    // === CULTURE / SCIENCES / SOCIÉTÉ ===
    { name: "France Culture", url: "https://www.radiofrance.fr/franceculture/rss", orientation: "centre-gauche", category: "culture" },
    { name: "Futura Sciences", url: "https://www.futura-sciences.com/rss/actualites.xml", orientation: "centre", category: "sciences" },
    { name: "Sciences et Avenir", url: "https://www.sciencesetavenir.fr/rss.xml", orientation: "centre", category: "sciences" },
    { name: "Konbini", url: "https://www.konbini.com/fr/feed/", orientation: "centre", category: "culture" },
    { name: "Numerama", url: "https://www.numerama.com/feed/", orientation: "centre", category: "tech" },
    { name: "Zataz", url: "https://www.zataz.com/feed/", orientation: "neutre", category: "tech" },
    { name: "Reflets", url: "https://reflets.info/feeds/public", orientation: "gauche", category: "tech" },
    { name: "Journal du Geek", url: "https://www.journaldugeek.com/feed/", orientation: "neutre", category: "tech" },

    // === ECO & CRYPTO ===
    { name: "Journal du coin", url: "https://journalducoin.com/feed/", orientation: "neutre", category: "crypto" },
    { name: "Cryptoast", url: "https://cryptoast.fr/feed/", orientation: "neutre", category: "crypto" },
    { name: "Capital.fr", url: "https://feed.prismamediadigital.com/v1/cap/rss", orientation: "centre-droit", category: "économie" },

    // === SPORT ===
    { name: "L'Équipe", url: "https://dwh.lequipe.fr/api/edito/rss?path=/Tous%20sports", orientation: "centre", category: "sport" },

    // === DÉFENSE / MILITAIRE ===
    { name: "Cyber.gouv.fr (ANSSI)", url: "https://cyber.gouv.fr/actualites/feed", orientation: "gouvernement", category: "cyber" },
    { name: "OPEX360", url: "https://feeds.feedburner.com/ZoneMilitaire", orientation: "droite", category: "défense" },

    // === INDÉPENDANTS ===
    { name: "Reporterre", url: "https://reporterre.net/spip.php?page=backend", orientation: "gauche", category: "environnement" },
    { name: "Blast", url: "https://api.blast-info.fr/rss.xml", orientation: "gauche", category: "indépendant" },
    { name: "Arrêt sur Images", url: "https://api.arretsurimages.net/api/public/rss/all-content", orientation: "centre-gauche", category: "investigation" },
    { name: "Apar.tv", url: "https://www.apar.tv/latest/rss/", orientation: "centre-gauche", category: "culture" },
    { name: "Le Média en 4-4-2", url: "https://lemediaen442.fr/feed/", orientation: "centre-gauche", category: "indépendant" },

    // === PRESSE D'OPINION & IDÉOLOGIQUE ===
    { name: "L'Humanité", url: "https://www.humanite.fr/sections/politique/feed", orientation: "gauche", category: "politique" },
    { name: "L'Humanité (Eco)", url: "https://www.humanite.fr/sections/social-et-economie/feed", orientation: "gauche", category: "économie" },
    { name: "L'Humanité (Opinion)", url: "https://www.humanite.fr/mot-cle/extreme-droite/feed", orientation: "gauche", category: "politique" },
    { name: "Politis", url: "https://www.politis.fr/flux-rss-apps/", orientation: "gauche", category: "politique" },
    { name: "Regards", url: "https://regards.fr/category/l-actu/feed/", orientation: "gauche", category: "politique" },
    { name: "La Croix", url: "https://www.la-croix.com/feeds/rss/societe.xml", orientation: "centre-droit", category: "généraliste" },
    { name: "La Croix (Politique)", url: "https://www.la-croix.com/feeds/rss/politique.xml", orientation: "centre-droit", category: "politique" },
    { name: "La Croix (Culture)", url: "https://www.la-croix.com/feeds/rss/culture.xml", orientation: "centre-droit", category: "culture" },
    { name: "L'Opinion", url: "https://feeds.feedburner.com/lopinion", orientation: "droite", category: "politique" },
    { name: "Valeurs Actuelles", url: "https://www.valeursactuelles.com/feed?post_type=post", orientation: "extreme-droite", category: "politique" },
    { name: "Causeur", url: "https://www.causeur.fr/feed", orientation: "extreme-droite", category: "politique" },
    { name: "BFMTV", url: "https://www.bfmtv.com/rss/news-24-7/", orientation: "centre-droit", category: "tv" },
    { name: "BFMTV (People)", url: "https://www.bfmtv.com/rss/people/", orientation: "centre-droit", category: "people" },
    { name: "BFMTV (Crypto)", url: "https://www.bfmtv.com/rss/crypto/", orientation: "centre-droit", category: "crypto" },
    { name: "RMC", url: "https://rmc.bfmtv.com/rss/actualites/", orientation: "centre", category: "radio" },
    { name: "Révolution Permanente", url: "https://www.revolutionpermanente.fr/spip.php?page=backend_portada", orientation: "extreme-gauche", category: "politique" },
    { name: "Cnews", url: "https://www.cnews.fr/rss.xml", orientation: "extreme-droite", category: "tv" },
    { name: "Basta!", url: "https://basta.media/spip.php?page=backend", orientation: "extreme-gauche", category: "politique" },
    { name: "Ballast", url: "https://www.revue-ballast.fr/feed/", orientation: "extreme-gauche", category: "politique" },

    // === PRESSE ÉTRANGÈRE ===
    { name: "RTBF", url: "https://rss.rtbf.be/article/rss/highlight_rtbf_info.xml?source=internal", orientation: "centre-gauche", category: "international" },

    // === ZAP ===
    { name: "VU FranceTV", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCqt99sKYNTxqlHtzV9weUYA", orientation: "neutre", category: "divertissement" },

    // === OUTRE-MER ===
    { name: "Mayotte Hebdo", url: "https://mayottehebdo.com/feed/", orientation: "centre", category: "outre-mer" },
    { name: "L'Info Kwezi", url: "https://www.linfokwezi.fr/feed/", orientation: "centre", category: "outre-mer" },
    { name: "France-Antilles", url: "https://www.martinique.franceantilles.fr/actualite/rss.xml", orientation: "centre", category: "outre-mer" },
    { name: "RCI.fm", url: "https://rci.fm/martinique/fb/articles_rss_mq", orientation: "centre", category: "outre-mer" },
    { name: "Tahiti Infos", url: "https://www.tahiti-infos.com/xml/syndication.rss", orientation: "centre", category: "outre-mer" },
    { name: "Outremers360", url: "https://api.outremers360.com/rss/fil-info.xml", orientation: "centre", category: "outre-mer" },

    // === ALTERNATIF / INDÉPENDANT ===
    { name: "Le Gossip", url: "https://www.legossip.net/spip.php?page=backend", orientation: "neutre", category: "people" },
    { name: "Public", url: "https://www.public.fr/feed", orientation: "neutre", category: "people" },

    // --- ALTERNATIF / OPINION / GÉOPOLITIQUE ---
    { name: "Réseau International", url: "https://reseauinternational.net/feed/", orientation: "extreme-droite", category: "alternatif" },
    { name: "Le Saker Francophone", url: "https://lesakerfrancophone.fr/feed/", orientation: "extreme-droite", category: "alternatif" },
    { name: "Geopolintel", url: "https://geopolintel.fr/spip.php?page=backend", orientation: "extreme-droite", category: "alternatif" },
    { name: "Nexus", url: "https://nexus.fr/feed/", orientation: "extreme-droite", category: "alternatif" },
    { name: "Enquête du Jour", url: "https://enquetedujour.fr/feed/", orientation: "extreme-droite", category: "alternatif" },

    // --- EUROPÉEN / SCIENCE / COMMUNICATION ---
    { name: "Le Grand Continent", url: "https://legrandcontinent.eu/fr/feed/", orientation: "centre-gauche", category: "europe" },
    { name: "The Conversation France", url: "https://theconversation.com/fr/articles.atom", orientation: "centre", category: "sciences" },
    { name: "Intelligence Online", url: "https://feeds.feedburner.com/IntelligenceOnline-fr", orientation: "centre", category: "tech" },
    { name: "CNRS Le Journal", url: "https://lejournal.cnrs.fr/rss", orientation: "neutre", category: "sciences" }
];
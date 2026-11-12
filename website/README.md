# Halman Thompson website (rebuild preview)

Static site generated from a scrape of halmanthompson.com. `site/` is the built output that Vercel serves. `source/` holds the generator: `extract.py` turns scraped pages into `content.json`, and `gen.py` renders `site/`.

Design direction: [DESIGN.md](DESIGN.md). Copy that was written or still needs checking: [COPY-NOTES.md](COPY-NOTES.md).

The preview is marked `noindex` so it can't compete with the live site in search.

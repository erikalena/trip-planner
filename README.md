# Trip Planner

A cloud based environment to plan which Points of Interest (POI) to visit during your trip.

Data are queried from Wikidata using SPARQL, in particular: museums, archaelogical sites, roads/squares and churches are selected.
The user then can further customize this choice and the POI are ordered and selected with respect to the number of site links they have.

For each entity the ID, label, coordinates, an image and other data are extracted from wikidata, while a brief description is queried from Wikipedia.

```sparql
SELECT ?item ?itemLabel (SAMPLE(?coords) AS ?coords) (SAMPLE(?image) AS ?image) ?label ( COUNT( ?sitelink ) AS ?sitelink_count ) 
WHERE {
      ?item wdt:P131 wd:${code}.
      OPTIONAL { ?item wdt:P625 ?coords.}
      OPTIONAL { ?item wdt:P18 ?image. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "it". }

      { 
          ?item wdt:P31 wd:Q33506. 
          wd:Q33506 rdfs:label ?label.
          FILTER((LANG(?label)) = "it")
      }
      UNION
      { 
          ?item wdt:P31 wd:Q174782. 
          wd:Q174782 rdfs:label ?label.
          FILTER((LANG(?label)) = "it")
      }
      UNION
      { 
          ?item wdt:P31 wd:Q839954. 
          wd:Q839954 rdfs:label ?label.
          FILTER((LANG(?label)) = "it")
      }
      UNION
      { 
          ?item wdt:P31 wd:Q16970.
          wd:Q16970 rdfs:label ?label.
          FILTER((LANG(?label)) = "it")
      }

      ?sitelink schema:about ?item.
      
} Group by ?item ?itemLabel ?label

```


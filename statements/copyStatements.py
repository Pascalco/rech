# -*- coding: UTF-8 -*-
##
# To the extent possible under law, the author(s) have dedicated all copyright
# and related and neighboring rights to this software to the public domain
# worldwide. This software is distributed without any warranty.
#
# See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the
# CC0 Public Domain Dedication.

# script to collet datatypes, url formatters (P1630) and regex (P1793).

import json
import requests

result = {}

payload = {
    'query': """SELECT ?property ?type ?formatterurl ?regex WHERE{
                  ?property wikibase:propertyType ?type .
                  FILTER (?type IN (wikibase:ExternalId, wikibase:CommonsMedia, wikibase:Url, wikibase:String))
                  OPTIONAL{
                    ?property wdt:P1630 ?formatterurl
                  }
                  OPTIONAL{
                    ?property wdt:P1793 ?regex
                  }
                }""",
    'format': 'json'
}

r = requests.get('https://query.wikidata.org/bigdata/namespace/wdq/sparql?', params=payload)
data = r.json()
for m in data['results']['bindings']:
    property = m['property']['value'].replace('http://www.wikidata.org/entity/', '')
    type = m['type']['value'].replace('http://wikiba.se/ontology#', '')
    result[property] = {'type': type}
    if 'formatterurl' in m:
        result[property]['formatterurl'] = m['formatterurl']['value']
    if 'regex' in m:
        result[property]['regex'] = m['regex']['value']



with open('public_html/rech/statements/statements.json', 'w') as outfile:
    json.dump(result, outfile)
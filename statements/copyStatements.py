# -*- coding: UTF-8 -*-
##
# To the extent possible under law, the author(s) have dedicated all copyright 
# and related and neighboring rights to this software to the public domain 
# worldwide. This software is distributed without any warranty. 
#
# See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the 
# CC0 Public Domain Dedication.

# script to collet url formatters (P1630) and format constraints (Template Constraint:Format). 

import pywikibot
from pywikibot.data import api
import re

site = pywikibot.Site("wikidata", "wikidata")

#get all url formatter values (P1630) from property pages
f1 = open('public_html/rech/statements/url.dat','w')
blcontinue = '120|0'
while True:
	params = {
		'action': 'query',
		'list': 'backlinks',
		'bltitle': 'Property:P1630',
		'blnamespace': '120',
		'bllimit': '1000',
		'blcontinue': blcontinue
	}
	req = api.Request(**params)
	data = req.submit()
	for m in data['query']['backlinks']:
		params2 = {
			'action': 'wbgetclaims',
			'entity': m['title'][9:],
			'property': 'P1630'
		}
		req2 = api.Request(**params2)
		data2 = req2.submit()
		f1.write(m['title'][9:]+'|'+data2['claims']['P1630'][0]['mainsnak']['datavalue']['value']+'\n')
	if 'query-continue' in data:
		blcontinue = data['query-continue']['backlinks']['blcontinue']
	else:
		print 'ende url formatter'
		break
f1.close()

#get all regex expression in the Constraint:Format template from property talk pages
f2 = open('public_html/rech/statements/regex.dat','w')
atcontinue = 'Constraint:Format|0'
while True:
	params = {
		'action': 'query',
		'list': 'alltransclusions',
		'atprefix': 'Constraint:Format',
		'atprop': 'ids',
		'atlimit' : '1000',
		'atcontinue': atcontinue
	}
	req = api.Request(**params)
	data = req.submit()
	for m in data['query']['alltransclusions']:
		params2 = {
			'action': 'query',
			'pageids': m['fromid'],
			'prop': 'info'
		}
		req2 = api.Request(**params2)
		data2 = req2.submit()
		title = data2['query']['pages'][str(m['fromid'])]['title']
		try:
			page = pywikibot.Page(site, title)
			text = page.get()
			foo = text.split('{{Constraint:Format|pattern=<nowiki>')
			if len(foo) > 1:
				foo2 = foo[1].split('</nowiki>')
			else:
				foo = text.split('{{Constraint:Format|pattern=')
				foo2 = re.split('\||}',foo[1])
			f2.write(title[14:].encode('utf-8')+'|'+foo2[0].encode('utf-8','ignore')+'\n')
		except:
			print 'error with '+title
	if 'query-continue' in data:
		atcontinue = data['query-continue']['alltransclusions']['atcontinue']
		print atcontinue
	else:
		print 'ende regex'
		break
f2.close()

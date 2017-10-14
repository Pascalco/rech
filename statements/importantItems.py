#!/usr/bin/python
# -*- coding: UTF-8 -*-
#licensed under CC-Zero: https://creativecommons.org/publicdomain/zero/1.0

import MySQLdb


db = MySQLdb.connect(host="wikidatawiki.analytics.db.svc.eqiad.wmflabs", db="wikidatawiki_p", read_default_file="~/replica.my.cnf")
cursor = db.cursor()
cursor.execute('SELECT pl_title FROM pagelinks WHERE pl_from_namespace=0 AND pl_namespace=0 GROUP BY pl_title  ORDER BY count(*) DESC LIMIT 10000')
list = []
for item in cursor:
    list.append(item[0])
f1 = open('importantItems.dat', 'w')
f1.write('"'+'","'.join(list)+'"')
f1.close()    
        


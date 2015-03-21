/*
 * To the extent possible under law, the author(s) have dedicated all copyright 
 * and related and neighboring rights to this software to the public domain 
 * worldwide. This software is distributed without any warranty. 
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the 
 * CC0 Public Domain Dedication.
*/

/* load main table into #show and add hints
 * 
 * @return void.
*/
function loadTable(){
	$('#load').show()
	$('#show').fadeOut('fast', function(){
		$('#show').load('php/table.php',function(){
			$("#load").fadeOut('fast');
			$("#show").fadeIn('slow');
			$('tr').each(function(){
				if ($(this).find('.title').attr('href') != undefined){
					el = $(this).find('.title');
					qid = el.attr('href').substring(24);
					addTitleTag(el,qid); // add alt tag with automated description
					var comment = $(this).find('.comment')
					if (comment.html().search('<span class="gray">Created new item: </span>') >-1){
						addNumOfSitelinks(comment,qid); //add hint if no sitelinks are on item
					}
					reg = comment.html().match(/<span class="gray">(Added|Changed) \[(.*)\] label: <\/span>/);
					if (reg != null){
						checkLabelSitelink(comment,qid,reg[2],$(this).find('.translateIt').attr('data-translate'));
						checkScript(comment,reg[2],$(this).find('.translateIt').attr('data-translate'));
						checkBadword(comment,$(this).find('.translateIt').attr('data-translate'));
						checkLanguageAsTerm(comment,$(this).find('.translateIt').attr('data-translate'));
					}
					reg = comment.html().match(/<span class="gray">(Added|Changed) \[(.*)\] description: <\/span>/);
					if (reg != null){
						checkLabelDescription(comment,qid,reg[2],$(this).find('.translateIt').attr('data-translate'));
						checkScript(comment,reg[2],$(this).find('.translateIt').attr('data-translate'));
						checkBadword(comment,$(this).find('.translateIt').attr('data-translate'));
						checkLanguageAsTerm(comment,$(this).find('.translateIt').attr('data-translate'));
					}
				}
			});
		});
	});
}

/* add automated descriptions to alt tag
 * 
 * @param  object el	object to add the alt tag
 * @param  string qid	affected item
 * @return void.
*/
function addTitleTag(el,qid){
	$.ajax({
		type: 'GET',
		url: '../../autodesc',
		data: {q : qid, lang : 'en', mode : 'short', format: 'json'}
	})
	.done(function(data){
		if (data.result != '<i>Cannot auto-describe</i>'){
			el.attr('title',data.result);
		}else{
			el.attr('title','no auto-description available');
		}
	});
}

/* add hint behind edit comment if no sitelinks are on item
 * 
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @return void.
*/
function addNumOfSitelinks(el,qid){
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'wbgetentities',
		props : 'sitelinks',
		ids : qid,
		format: 'json'
	},function(data){
		if (data.entities[qid].sitelinks == undefined){
			el.append(' <span class="red"><small>no sitelinks</small></span>');
		}
	});
}

/* add hint behind edit comment if description is equal to label
 * 
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @param  string lang  language of the edited description
 * @param  string desc  edited description
 * @return void.
*/
function checkLabelDescription(el,qid,lang,desc){
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'wbgetentities',
		props : 'labels',
		languages : lang,
		ids : qid,
		format: 'json'
	},function(data){
		if (data.entities[qid].labels != undefined){
			if (data.entities[qid].labels[lang] != undefined){
				if (desc == data.entities[qid].labels[lang].value){
					el.append(' <span class="red"><small>description==label</small></span>');
				}
			}
		}
	});
}

/* add hint behind edit comment if label is equal to sitelink name
 * 
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @param  string lang  language of the edited label
 * @param  string label	edited label
 * @return int.
*/
function checkLabelSitelink(el,qid,lang,label){
	var wiki = lang+'wiki'; // wrong in some cases
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'wbgetentities',
		props : 'sitelinks',
		sitefilter: wiki,
		ids : qid,
		format: 'json'
	},function(data){
		if (data.entities[qid].sitelinks != undefined){
			if (data.entities[qid].sitelinks[wiki] != undefined){
				if (label == data.entities[qid].sitelinks[wiki].title){
					el.append(' <span class="green"><small>label==sitelink</small></span>');
					return 1;
				}
			}
		}
		addNumOfLabels(el,qid,lang,label);
		return 1;
	});
}

/* add hint behind edit comment if the term is written in the non-standard script
 * 
 * @param  object el	object to add the hint
 * @param  string lang  language of the edited term
 * @param  string term  edited term
 * @return void.
*/
function checkScript(el,lang,term){
	var latin = ['af','ak','an','ang','arn','ast','ay','az','bar','bcl','bi','bm','br','bs','ca','cbk-zam','ceb','ch','chm','cho','chy','co','crh-latn','cs','csb','cy','da','de','diq','dsb','ee','eml','en','eo','es','et','eu','ff','fi','fj','fo','fr','frp','frr','fur','fy','ga','gd','gl','gn','gsw','gv','ha','haw','ho','hr','hsb','ht','hu','hz','id','ie','ig','ik','ilo','io','is','it','jbo','jv','kab','kg','ki','kj','kl','kr','ksh','ku','kw','la','lad','lb','lg','li','lij','lmo','ln','lt','lv','map-bms','mg','mh','mi','min','ms','mt','mus','mwl','na','nah','nan','nap','nb','nds','nds-nl','ng','nl','nn','nov','nrm','nv','ny','oc','om','pag','pam','pap','pcd','pdc','pih','pl','pms','pt','pt-br','qu','rm','rn','ro','roa-tara','rup','rw','sc','scn','sco','se','sg','sgs','sk','sl','sm','sn','so','sq','sr-el','ss','st','stq','su','sv','sw','szl','tet','tk','tl','tn','to','tpi','tr','ts','tum','tw','ty','uz','ve','vec','vi','vls','vo','vro','wa','war','wo','xh','yo','za','zea','zu'];
	var nonlatin = ['ab','am','arc','ar','arz','as','ba','be','be-tarask','bg','bh','bn','bo','bpy','bxr','chr','ckb','cr','cv','dv','dz','el','fa','gan','glk','got','gu','hak','he','hi','hy','ii','iu','ja','ka','kbd','kk','km','kn','ko','koi','krc','ks','ku-arab','kv','ky','lbe','lez','lo','mai','mdf','mhr','mk','ml','mn','mo','mr','mrj','my','myv','mzn','ne','new','or','os','pa','pnb','pnt','ps','ru','rue','sa','sah','sd','si','sr','ta','te','tg','th','ti','tt','tyv','udm','ug','uk','ur','wuu','xmf','yi','zh','zh-classical','zh-hans','zh-hant','zh-tw','zh-cn','zh-hk','zh-sg'];
	if ($.inArray(lang,latin)>-1){
		var filter = /[\u4e00-\u9fff]|[\u0400-\u0500]/i; //chinese and cyrillic characters
	}else if ($.inArray(lang,nonlatin)>-1){
		var filter = /[a-z]/i;
	}else{
		var filter = / /i;
	}
	if (filter.test(term)){
		el.append(' <span class="red"><small>wrong script</small></span>');
	}		
}

/* add hint behind edit comment if the term contains a bad word
 * 
 * @param  object el	object to add the hint
 * @param  string term  edited term
 * @return void.
*/
function checkBadword(el,term){
	var filter = /\bass(hole|wipe|\b)|bitch|\bcocks?\b|\bdicks?\b|\bloo?ser|\bcunts?\b|dildo|douche|fuck|nigg(er|a)|pedo(ph|f)ile|\bfag(g|\b)|pen+is|blowjob|\bcrap|\bballs|sluts?\b|\btrolo?l|whore|racist|\bsuck|\bshit|\bgays?\b|\bblah|\bpuss(y|ies?)|\bawesome\b|\bpo{2,}p?\b|\bidiots?\b|\bretards?\b|\byolo\b|\b(my|ya|y?our|his|her) m(ama|om|other)|vaginas?\b|\bswag|\bcaca\b|\bmierda|\bpenes?\b|\bpulla\b|\bpopos?\b|\bput[ao]\b|\btu madre\b|\btonto\b|[:;]-?\)$|\bxd *$|<3|\bnazi\b/i
	if (filter.test(term)){
		el.append(' <span class="red"><small>bad word</small></span>');
	}
}

/* add hint behind edit comment if the term contains a language name
 * 
 * @param  object el	object to add the hint
 * @param  string term  edited term
 * @return void.
*/
function checkLanguageAsTerm(el,term){
	var filter = /^([ei]n )??(a(frikaa?ns|lbanian?|lemanha|ng(lais|ol)|ra?b(e?|[ei]c|ian?|isc?h)|rmenian?|ssamese|azeri|z[eə]rba(ijani?|ycan(ca)?|yjan)|нглийский)|b(ahasa( (indonesia|jawa|malaysia|melayu))?|angla|as(k|qu)e|[aeo]ng[ao]?li|elarusian?|okmål|osanski|ra[sz]il(ian?)?|ritish( kannada)?|ulgarian?)|c(ebuano|hina|hinese( simplified)?|zech|roat([eo]|ian?)|atal[aà]n?|рпски|antonese)|[cč](esky|e[sš]tina)|d(an(isc?h|sk)|e?uts?ch)|e(esti|ll[hi]nika|ng(els|le(ski|za)|lisc?h)|spa(g?[nñ]h?i?ol|nisc?h)|speranto|stonian|usk[ae]ra)|f(ilipino|innish|ran[cç](ais|e|ez[ao])|ren[cs]h|arsi|rancese)|g(al(ego|ician)|uja?rati|ree(ce|k)|eorgian|erman[ay]?|ilaki)|h(ayeren|ebrew|indi|rvatski|ungar(y|ian))|i(celandic|ndian?|ndonesian?|ngl[eê]se?|ngilizce|tali(ano?|en(isch)?))|ja(pan(ese)?|vanese)|k(a(nn?ada|zakh)|hmer|o(rean?|sova)|urd[iî])|l(at(in[ao]?|vi(an?|e[sš]u))|ietuvi[uų]|ithuanian?)|m(a[ck]edon(ian?|ski)|agyar|alay(alam?|sian?)?|altese|andarin|arathi|elayu|ontenegro|ongol(ian?)|yanmar)|n(e(d|th)erlands?|epali|orw(ay|egian)|orsk( bokm[aå]l)?|ynorsk)|o(landese|dia)|p(ashto|ersi?an?|ol(n?isc?h|ski)|or?tugu?[eê]se?(( d[eo])? brasil(eiro)?| ?\(brasil\))?|unjabi)|r(om[aâi]ni?[aă]n?|um(ano|änisch)|ussi([ao]n?|sch))|s(anskrit|erbian|imple english|inha?la|lov(ak(ian?)?|enš?[cč]ina|en(e|ij?an?)|uomi)|erbisch|pagnolo?|panisc?h|rbeska|rpski|venska|c?wedisc?h|hqip)|t(a(galog|mil)|elugu|hai(land)?|i[eế]ng vi[eệ]t|[uü]rk([cç]e|isc?h|iş|ey))|u(rdu|zbek)|v(alencia(no?)?|ietnamese)|welsh|(англиис|[kк]алмыкс|[kк]азахс|немец|[pр]усс|[yу]збекс|татарс)кий( язык)??|עברית|[kкқ](аза[кқ]ша|ыргызча|ирилл)|українськ(а|ою)|б(еларуская|ългарски( език)?)|ελλ[ηι]νικ(ά|α)|ქართული|हिन्दी|ไทย|[mм]онгол(иа)?|([cс]рп|[mм]акедон)ски|العربية|日本語|한국(말|어)|‌हिनद़ि|বাংলা|ਪੰਜਾਬੀ|मराठी|ಕನ್ನಡ|اُردُو|தமிழ்|తెలుగు|ગુજરાતી|فارسی|پارسی|മലയാളം|پښتو|မြန်မာဘာသာ|中文(简体|繁體)?|中文（(简体?|繁體)）|简体|繁體)( language)??$/i
	if (filter.test(term)){
		el.append(' <span class="red"><small>language name</small></span>');
	}
}

/* add hint behind edit comment with the number of equal labels in other languages
 * 
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @param  string lang  language of the edited label
 * @param  string label	edited label
 * @return void.
*/
function addNumOfLabels(el,qid,lang,label){
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'wbgetentities',
		props : 'labels',
		ids : qid,
		format: 'json'
	},function(data){
		var cnt = 0;
		for (m in data.entities[qid].labels){
			if (m == lang)continue;
			if (data.entities[qid].labels[m].value == label) cnt += 1;
		}
		if (cnt > 0){
			el.append(' <span class="green"><small>'+cnt.toString()+' identical label(s)</small></span>');
		}
	});
}

/* patrols an edit
 * 
 * @param  string qid	affected item
 * @param  string revid	revision to patrol
 * @return void.
*/

function patrol(qid,revid){
	$.ajax({
		type: 'GET',
		url: 'php/oauth.php',
		data: {action : 'patrol', revid : revid, title : qid}
	})
	.done(function(data){
		if (data == 'patrolled'){
			$('#'+revid).fadeOut('slow')
		}else{
			$("#hovercard").html(data).show()
		}
	});
}

$(document).ready(function(){
	var mover = 0;
	
	/* mobile menu */
	$('.nav').append($('<div class="nav-mobile"></div>'));
	$('.nav-item').has('ul').prepend('<div class="nav-click"><i class="nav-arrow"></i></div>');
	$('.nav-mobile').click(function(){
		$('.nav-list').toggle();
	});
	$('.nav-list').on('click', '.nav-click', function(){
		$(this).siblings('.nav-submenu').toggle();
		$(this).children('.nav-arrow').toggleClass('nav-rotate');			
	});	

	/* remove hovercards */
	$('html').on('click',function(e){
		$("#hovercard").hide();
		$("#hovercard2").hide();
		mover = 0;
		$('tr').css('background-color','');
	});

	/* reload page */
	$('html').on('click','.reload',function(e){
		loadTable();
	});	
	
	/* highlight all edits of same user */
	$('html').on('mouseover','.user',function(){
		if (mover == 0) $('.user:contains("'+$(this).text()+'")').parent().parent().parent().css('background-color','#FFCE7B');
	});	
	$('html').on('mouseout','.user',function(){
		if (mover == 0)	$('.user:contains("'+$(this).text()+'")').parent().parent().parent().css('background-color','');
		
	});

	/* user hovercard */
	$('html').on('click','.user',function(e){
		e.preventDefault();
		var usertext = $(this).text();
		$("#hovercard2").css({'top':e.pageY,'left':e.pageX});
		var editNum = $('.user:contains("'+usertext+'")').length;
		cardtext = ''
		$.getJSON('//www.wikidata.org/w/api.php?callback=?',{
			action : 'query',
			titles : 'User:'+usertext+'|User talk:'+usertext,
			format: 'json'
		},function(data){
			for (m in data.query.pages){	
				if (m != '-1'){
					if (data.query.pages[m].ns == 2) cardtext += '<a href="//www.wikidata.org/wiki/User:'+usertext+'" title="User page">user</a> · '
					if (data.query.pages[m].ns == 3) cardtext += '<a href="//www.wikidata.org/wiki/User_talk:'+usertext+'" title="Talk">talk</a> · '
				}
			}
			cardtext += '<a href="//www.wikidata.org/wiki/Special:Contributions/'+usertext+'" title="Contributions">contr</a> · '
				+'<a class="patrolalluser green" data-usertext="'+usertext+'" href="#" title="Patrol all highlighted edits" target="_parent">patrol '+editNum+' edit';
			if (editNum != 1) cardtext += 's';
			cardtext += '</a>';
			$("#hovercard2").html(cardtext);
			$("#hovercard2").show();
			mover = 1;
			$('.user:contains("'+usertext+'")').parent().parent().parent().css('background-color','#FFCE7B');
		});
	});
	
	/* translate */
	$('html').on('click','.translateIt', function(e){
		e.preventDefault();
		el = $(this);
		$.ajax({
			type: 'POST',
			url: 'php/translate.php',
			data: {string : $(this).attr('data-translate')}
		})
		.done(function(data){
			el.replaceWith(' → '+data)
		});
	});

	/* patrol all edits (activated if edits sitelinks or moves are selected) */
	$('html').on('click','.patrolall',function(e){
		e.preventDefault();
		$('tr').each(function(){
			if ($(this).find('.title').attr('href') != undefined){
				qid = $(this).find('.title').attr('href').substring(24);
				revid = $(this).attr('id');
				patrol(qid,revid);
			}
		});
	});

	/* patrol all user edits */
	$('html').on('click','.patrolalluser',function(e){
		e.preventDefault();
		usertext = $(this).attr('data-usertext');
		$('.user:contains("'+usertext+'")').parent().parent().parent().each(function(){
			if ($(this).find('.title').attr('href') != undefined){
				qid = $(this).find('.title').attr('href').substring(24);
				revid = $(this).attr('id');
				patrol(qid,revid);
			}
		});
	});	
	
	/* patrol or undo */
	$('html').on('click','.edit',function(e){
		e.preventDefault();
		qid = $(this).parent().parent().parent().find('.title').attr('href').substring(24);
		revid = $(this).parent().parent().parent().attr('id');
		$.ajax({
			type: 'GET',
			url: 'php/oauth.php',
			data: {action : $(this).text(), revid : revid, title : qid}
		})
		.done(function(data){
			if (data == 'patrolled'){
				$('#'+revid).fadeOut('slow')
			}else{
				$("#hovercard").html(data).show()
			}
		});
	});

	/* hovercards for images */
	$('html').on('click','.image',function(e){
		e.preventDefault();
		file = 'File:'+$(this).text()
		$.getJSON('//commons.wikimedia.org/w/api.php?callback=?',{
			action : 'query',
			prop : 'imageinfo',
			iiprop : 'url',
			iiurlwidth : '200',
			titles : file,
			format: 'json'
		},function(data){
			for (m in data.query.pages){
				if (m == '-1'){
					$("#hovercard").html('image does not exist').show();
				}else{
					$("#hovercard").html('<img src="'+data.query.pages[m].imageinfo[0].thumburl+'" width="200" alt="" />').show();
				}
			}
		});
	});

	/* hovercards for diff */
	$('html').on('click','.diffview',function(e){
		e.preventDefault();
		revid = $(this).parent().parent().parent().attr('id');
		$.ajax({
			url : 'php/proxy_html.php',
			data : {action : 'render', diff: revid, diffonly: 1},
			type : 'get',
		})
		.done(function(data){
			$("#hovercard").html(data.replace("href='","href='//www.wikidata.org/wiki/")).show()
		});
	});
});
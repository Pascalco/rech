/*
 * To the extent possible under law, the author(s) have dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide. This software is distributed without any warranty.
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the
 * CC0 Public Domain Dedication.
*/

var choiceEdittype = {'terms' : 'terms','claims' : 'claims','sitelinks' : 'sitelinks', 'merges' : 'merges', 'page moves' : 'moves', 'new items' : 'new', 'display all edits' : 'all'};
var choiceItemtype = {'all items': -1, 'Top 10,000 items': 10000, 'pagepile': 'pp'}
var choiceLimit = {'25 edits' : '25', '50 edits' : '50', '100 edits' : '100', '250 edits' : '250'};
var choiceReload = {'1 minute': 60,  '5 minutes' : 300,  '10 minutes' : 600, 'no auto-reload': 0};
var isRollbacker = 0;
var username = '';
var userlang = 'en';
var edittype = 'all';
var filter = '';
var pagepile = '';
var pat = '.'
var limit = '50';
var itemtype = -1;
var reloadtime = 0;
var jwttoken = '';
/* load navigation menu
 *
 * @return void.
*/
function loadNav() {
    var content = '<ul class="nav-list leftbox"> \
        <li class="nav-item">This is a filtered version of <a href="//www.wikidata.org/wiki/Special:RecentChanges" class="normallink">Special:RecentChanges</a> on Wikidata. Only unpatrolled edits are shown.</li> \
        <li class="nav-item"><span>Type of edits </span><ul class="nav-submenu">';
    for (var m in choiceEdittype) {
        if(choiceEdittype[m] == edittype) {
            content += '<li class="nav-submenu-item"><a class="inactive">' + m + '</a></li>';
        } else {
            content += '<li class="nav-submenu-item"><a class="show" href="#">' + m + '</a></li>';
        }
    }
    content += '</ul></li><li class="nav-item"><span>Type of items </span><ul class="nav-submenu">';
    for (var m in choiceItemtype) {
        if (choiceItemtype[m] == itemtype) {
            content += '<li class="nav-submenu-item"><a class="inactive">' + m + '</a></li>';
        } else {
            content += '<li class="nav-submenu-item"><a class="itemtype" href="#">' + m + '</a></li>';
        }
    }

    if (itemtype == 'pp'){
        content += '<form href="#" id="pagepile"><input type="text" value="' + pagepile + '" name="pagepile" class="inputtext" placeholder="PagePile ID" /><input type="submit" value="filter" /></form>';
    }

    content += '</ul></li><li class="nav-item"><span>Number of edits </span><ul class="nav-submenu">';
    for (var m in choiceLimit) {
        if (choiceLimit[m] == limit) {
            content += '<li class="nav-submenu-item"><a class="inactive">' + m + '</a></li>';
        } else {
            content += '<li class="nav-submenu-item"><a class="limit" href="#">' + m + '</a></li>';
        }
    }
    content += '</ul></li><li class="nav-item"><span>Reload after </span><ul class="nav-submenu">';
    for (var m in choiceReload) {
        if (choiceReload[m] == reloadtime) {
            content += '<li class="nav-submenu-item"><a class="inactive">' + m + '</a></li>';
        } else {
            content += '<li class="nav-submenu-item"><a class="setreload" href="#">' + m + '</a></li>';
        }
    }
    content += '</ul></li></ul>';

    content += '<ul class="nav-list rightbox">';

    if (username != '') {
        content += '<li class="nav-item"><span><a href="https://plnode.toolforge.org/logout?token='+ jwttoken +'" target="_parent">logout</a></span></li> \
            <li class="nav-item"><span><a href="//www.wikidata.org/wiki/Special:Contributions/' + username + '">your edits</a></span></li> \
            <li class="nav-item"><span><a href="//www.wikidata.org/w/index.php?title=Special:Log&type=patrol&user=' + username + '">your patrols</a></span></li>';
    } else {
        content += '<li class="nav-item"><span><a href="https://plnode.toolforge.org/authorize?landingpage=https://pltools.toolforge.org/rech/landingpage.php">login</a></span></li>';
    }
    content += '</ul></div>';

    if (edittype == 'terms' || edittype == 'sitelinks' || edittype == 'claims') {
        if (edittype == 'terms'){
            placeholdertext = 'enter language codes';
        } else if (edittype == 'sitelinks') {
            placeholdertext = 'enter project codes';
        } else {
            placeholdertext = 'enter property ID';
        }
        content += '<form href="#" id="filter"><input type="text" value="' + filter + '" name="filter" class="inputtext" placeholder="' + placeholdertext + '" /><input type="submit" value="filter" /></form>';
    }


    $('.nav').html(content);

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
}


/* load main table into #show and add hints
 *
 * @return void.
*/
function loadTable(){
	$('#load').show()
	$('#show').fadeOut('fast', function(){
		$('#show').load('php/table.php?limit='+limit+'&pat='+pat+'&userlang='+userlang+'&itemtype='+itemtype+'&pagepile='+pagepile,function(){
			$("#load").fadeOut('fast');
			$("#show").fadeIn('slow');
			$('tr').each(function(){
				if ($(this).find('.title').attr('href') != undefined){
					qid = $(this).attr('data-qid');
					var comment = $(this).find('.comment')
					if (comment.html().search('<span class="gray">Created new item: </span>') >-1){
						addNumOfSitelinks(comment,qid); //add hint if no sitelinks are on item
					}else{
						if (isRollbacker == 1) addRollback($(this).find('.buttons'),qid,$(this).attr('id')); //add rollback button
					}
					reg = comment.html().match(/<span class="gray">(Added|Changed) \[(.*)\] (label|description): <\/span>(.*)/);
					if (reg != null){
                        checks(comment, qid, reg[2], reg[3], reg[4]);
                    }
				}
			});
		});
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
		if (data.entities[qid].sitelinks != undefined){
            if ($.isEmptyObject(data.entities[qid].sitelinks)){
                el.append(' <span class="red"><small>no sitelinks</small></span>');
            }
		}
	});
}

/* add hints behind edit comment
 *
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @param  string lang  language of the edited term
 * @param  string type  either label or description
 * @param  string term  edited term
 * @return void.
*/
function checks(el, qid, lang, type, term){
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'wbgetentities',
		props : 'labels|sitelinks',
		languages : lang,
		ids : qid,
		format: 'json'
	},function(data){
        if (type == 'description'){
            checkLabelDescription(data.entities[qid], el, lang, term)
        }
        if (type == 'label'){
            checkLabelSitelink(data.entities[qid], el, lang, term)
        }
        checkScript(el, lang, term);
        checkBadword(el, term);
        checkLanguageAsTerm(el, term);
    });
}

/* add hint behind edit comment if description is equal to label
 *
 * @param  object data  object representing the item
 * @param  object el	object to add the hint
 * @param  string lang  language of the edited description
 * @param  string desc  edited description
 * @return void.
*/
function checkLabelDescription(data, el, lang, desc){
    if (data.labels != undefined){
        if (data.labels[lang] != undefined){
            if (desc == data.labels[lang].value){
                el.append(' <span class="red"><small>description==label</small></span>');
            }
        }
    }
}

/* add hint behind edit comment if label is equal to sitelink name
 *
 * @param  object data  object representing the item
 * @param  object el	object to add the hint
 * @param  string lang  language of the edited label
 * @param  string label	edited label
 * @return int.
*/
function checkLabelSitelink(data, el, lang, label){
	var wiki = lang+'wiki'; // wrong in some cases
    if (data.sitelinks != undefined){
        if (data.sitelinks[wiki] != undefined){
            if (label == data.sitelinks[wiki].title){
                el.append(' <span class="green"><small>label=sitelink</small></span>');
                return 1;
            }
        }
    }
    addNumOfLabels(data, el, lang, label);
    return 1;
}

/* add hint behind edit comment if the term is written in the non-standard script
 *
 * @param  object el	object to add the hint
 * @param  string lang  language of the edited term
 * @param  string term  edited term
 * @return void.
*/
function checkScript(el, lang, term){
	var latin = ['af','ak','an','ang','arn','ast','ay','az','bar','bcl','bi','bm','br','bs','ca','cbk-zam','ceb','ch','chm','cho','chy','co','crh-latn','cs','csb','cy','da','de','diq','dsb','ee','eml','en','en-gb','en-ca','eo','es','et','eu','ff','fi','fj','fo','fr','frp','frr','fur','fy','ga','gd','gl','gn','gsw','gv','ha','haw','ho','hr','hsb','ht','hu','hz','id','ie','ig','ik','ilo','io','is','it','jbo','jv','kab','kg','ki','kj','kl','kr','ksh','ku','kw','la','lad','lb','lg','li','lij','lmo','ln','lt','lv','map-bms','mg','mh','mi','min','ms','mt','mus','mwl','na','nah','nan','nap','nb','nds','nds-nl','ng','nl','nn','nov','nrm','nv','ny','oc','om','pag','pam','pap','pcd','pdc','pih','pl','pms','pt','pt-br','qu','rm','rn','ro','roa-tara','rup','rw','sc','scn','sco','se','sg','sgs','sk','sl','sm','sn','so','sq','sr-el','ss','st','stq','su','sv','sw','szl','tet','tk','tl','tn','to','tpi','tr','ts','tum','tw','ty','uz','ve','vec','vi','vls','vo','vro','wa','war','wo','xh','yo','za','zea','zu'];
	var nonlatin = ['ab','am','arc','ar','arz','as','ba','be','be-tarask','bg','bh','bn','bo','bpy','bxr','chr','ckb','cr','cv','dv','dz','el','fa','gan','glk','got','gu','hak','he','hi','hy','ii','iu','ja','ka','kbd','kk','km','kn','ko','koi','krc','ks','ku-arab','kv','ky','lbe','lez','lo','mai','mdf','mhr','mk','ml','mn','mo','mr','mrj','my','myv','mzn','ne','new','or','os','pa','pnb','pnt','ps','ru','rue','sa','sah','sd','si','sr','ta','te','tg','th','ti','tt','tyv','udm','ug','uk','ur','wuu','xmf','yi','zh','zh-classical','zh-hans','zh-hant','zh-tw','zh-cn','zh-hk','zh-sg'];
	if ($.inArray(lang, latin)>-1){
		var filter = /[\u4e00-\u9fff]|[\u0400-\u0500]/i; //chinese and cyrillic characters
	}else if ($.inArray(lang, nonlatin)>-1){
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
function checkBadword(el, term){
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
function checkLanguageAsTerm(el, term){
	var filter = /^([ei]n )??(a(frikaa?ns|lbanian?|lemanha|ng(lais|ol)|ra?b(e?|[ei]c|ian?|isc?h)|rmenian?|ssamese|azeri|z[eə]rba(ijani?|ycan(ca)?|yjan)|нглийский)|b(ahasa( (indonesia|jawa|malaysia|melayu))?|angla|as(k|qu)e|[aeo]ng[ao]?li|elarusian?|okmål|osanski|ra[sz]il(ian?)?|ritish( kannada)?|ulgarian?)|c(ebuano|hina|hinese( simplified)?|zech|roat([eo]|ian?)|atal[aà]n?|рпски|antonese)|[cč](esky|e[sš]tina)|d(an(isc?h|sk)|e?uts?ch)|e(esti|ll[hi]nika|ng(els|le(ski|za)|lisc?h)|spa(g?[nñ]h?i?ol|nisc?h)|speranto|stonian|usk[ae]ra)|f(ilipino|innish|ran[cç](ais|e|ez[ao])|ren[cs]h|arsi|rancese)|g(al(ego|ician)|uja?rati|ree(ce|k)|eorgian|erman[ay]?|ilaki)|h(ayeren|ebrew|indi|rvatski|ungar(y|ian))|i(celandic|ndian?|ndonesian?|ngl[eê]se?|ngilizce|tali(ano?|en(isch)?))|ja(pan(ese)?|vanese)|k(a(nn?ada|zakh)|hmer|o(rean?|sova)|urd[iî])|l(at(in[ao]?|vi(an?|e[sš]u))|ietuvi[uų]|ithuanian?)|m(a[ck]edon(ian?|ski)|agyar|alay(alam?|sian?)?|altese|andarin|arathi|elayu|ontenegro|ongol(ian?)|yanmar)|n(e(d|th)erlands?|epali|orw(ay|egian)|orsk( bokm[aå]l)?|ynorsk)|o(landese|dia)|p(ashto|ersi?an?|ol(n?isc?h|ski)|or?tugu?[eê]se?(( d[eo])? brasil(eiro)?| ?\(brasil\))?|unjabi)|r(om[aâi]ni?[aă]n?|um(ano|änisch)|ussi([ao]n?|sch))|s(anskrit|erbian|imple english|inha?la|lov(ak(ian?)?|enš?[cč]ina|en(e|ij?an?)|uomi)|erbisch|pagnolo?|panisc?h|rbeska|rpski|venska|c?wedisc?h|hqip)|t(a(galog|mil)|elugu|hai(land)?|i[eế]ng vi[eệ]t|[uü]rk([cç]e|isc?h|iş|ey))|u(rdu|zbek)|v(alencia(no?)?|ietnamese)|welsh|(англиис|[kк]алмыкс|[kк]азахс|немец|[pр]усс|[yу]збекс|татарс)кий( язык)??|עברית|[kкқ](аза[кқ]ша|ыргызча|ирилл)|українськ(а|ою)|б(еларуская|ългарски( език)?)|ελλ[ηι]νικ(ά|α)|ქართული|हिन्दी|ไทย|[mм]онгол(иа)?|([cс]рп|[mм]акедон)ски|العربية|日本語|한국(말|어)|‌हिनद़ि|বাংলা|ਪੰਜਾਬੀ|मराठी|ಕನ್ನಡ|اُردُو|தமிழ்|తెలుగు|ગુજરાતી|فارسی|پارسی|മലയാളം|پښتو|မြန်မာဘာသာ|中文(简体|繁體)?|中文（(简体?|繁體)）|简体|繁體)( language)??$/i
	if (filter.test(term)){
		el.append(' <span class="red"><small>language name</small></span>');
	}
}

/* add hint behind edit comment with the number of equal labels in other languages
 *
 * @param  object data  object representing the item
 * @param  object el	object to add the hint
 * @param  string lang  language of the edited label
 * @param  string label	edited label
 * @return void.
*/
function addNumOfLabels(data, el, lang, label){
    var cnt = 0;
    for (m in data.labels){
        if (m == lang) continue;
        if (data.labels[m].value == label) cnt += 1;
    }
    if (cnt > 0){
        el.append(' <span class="green"><small>' + cnt.toString() + ' identical label(s)</small></span>');
    }
}

/* add a rollback button to edits where possible
 *
 * @param  object el	object to add the hint
 * @param  string qid	affected item
 * @param  string revid	rev id of edit
 * @return void.
*/
function addRollback(el,qid,revid){
	$.getJSON('//wikidata.org/w/api.php?callback=?',{
		action : 'query',
		prop : 'revisions',
		titles : qid,
		rvprop : 'ids',
		format: 'json'
	},function(data){
		for (m in data.query.pages){
			if ('revisions' in data.query.pages[m] && data.query.pages[m].revisions[0].revid == revid){
				el.append('<a class="edit violet" href="#">rollback</a>');
			}
		}
	});
}

/* patrol, undo or rollback an edit
 *
 * @param  string qid		affected item
 * @param  string revid		revision to patrol
 * @param  string action	patrol or undo
 * @param  string usertext	user name
 * @return void.
*/

function patrol(qid, revid, action, usertext){
	if (typeof usertext === "undefined")usertext = '';
	$.ajax({
		type: 'GET',
		url: 'https://plnode.toolforge.org/edit',
		data: {action : action, revid : revid, entity : qid, user : usertext, token: jwttoken}
	})
	.done(function(data){
        if ('error' in data){
            $("#hovercard").html(data.error.info).show();
        } else if (action == 'undo'){
            patrol(qid, revid, 'patrol', usertext);
        } else if (action == 'patrol'){
			$('#'+revid).fadeOut('slow',function(){
				$('#'+revid).remove();
			});
		} else if(action == 'rollback'){
			$('tr').each(function(){
				if ($(this).find('.title').attr('href') != undefined){
					//if ($(this) == data.substr(9)) return false;
					if ($(this).attr('data-qid') == qid){
						$(this).fadeOut('slow',function(){
							$(this).remove();
						});
					}
				}
			});
		}
	});
}

/* patrols the first revision stored in a list
 *
 * @return void.
*/

function patrolFromList(list){
    setTimeout(() => {
        patrol(list[0][0], list[0][1], 'patrol');
        list.shift();
        if (list.length > 0){
            patrolFromList(list);
        }
    }, 500);
}

/* read parameters from URL
 *
 * @return void.
*/

function prefill() {
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/g, function(m, key, value) {
        if (key == 'limit'){
            limit = value;
        } else if (key == 'pat'){
            pat = value;
        } else if (key == 'itemtype'){
            itemtype = value;
        } else if (key == 'pagepile'){
            pagepile = value;
        }
    });
}


/* read cookies
 *
 * @param  string name		name of cookie
 * @return string           value of cookie
*/

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}


$(document).ready(function(){
	var mover = 0;

    prefill();

    jwttoken = getCookie('plnodeJwt');
    $.ajax({
        type: 'GET',
        url: 'https://plnode.toolforge.org/profile',
        data: {token : jwttoken}
   })
   .done(function(data){
        if ('username' in data && data.username !== 0){
            if ('rights' in data && data.rights.indexOf('rollback') > -1){
                isRollbacker = 1;
            }
            username = data.username;
            if ('options' in data && 'language' in data.options) {
                userlang = data.options.language;
            }
        }
        loadNav();
        loadTable();
    });

	/* set query edit type */
	$('html').on('click', '.show', function(e) {
        e.preventDefault();
		edittype = choiceEdittype[$(this).text()];
        switch(edittype){
            case 'all': pat='.';break;
            case 'terms': pat='label|description|alias';break;
            case 'claims': pat='claim|qualifier|reference';break;
            case 'sitelinks': pat='wbsetsitelink';break;
            case 'merges': pat='merge';break;
            case 'moves': pat='clientsitelink-update';break;
            case 'new': pat='wbeditentity-create:';break;
            default: pat='.';
        };
        loadNav();
        loadTable();
	});

	/* set query item type */
	$('html').on('click', '.itemtype', function(e) {
        e.preventDefault();
        itemtype = choiceItemtype[$(this).text()];
        if (itemtype != 'pp'){
            loadTable();
        }
        loadNav();
	});

	/* set query limit */
	$('html').on('click', '.limit', function(e) {
        e.preventDefault();
		limit = choiceLimit[$(this).text()];
        loadNav();
        loadTable();
	});

	/* set reload time */
	$('html').on('click', '.setreload', function(e) {
        e.preventDefault();
		reloadtime = choiceReload[$(this).text()];
        loadNav();
        if (reloadtime != 0){
            window.setInterval(function(){
                loadTable()
            },reloadtime*1000);
        }
	});

    /* filter terms by languages */
    $('html').on('submit', '#filter', function(e) {
        e.preventDefault();
        filter = $("[name='filter']").val().replace(/\s*,\s*/g, '|');
        if (edittype == 'terms'){
            if (filter != ''){
                pat = 'wbset(label|description|aliases)-(set|add|remove):[0-9]\\\\\|(' + filter + ')';
            }else{
                pat = 'label|description|alias';
            }
        } else if (edittype == 'sitelinks'){
            if (filter != ''){
                pat = 'wbsetsitelink-(set|add|remove|add-both|set-both):[0-9]\\\\\|(' + filter + ')';
            }else{
                pat = 'wbsetsitelink';
            }
        } else {
            if (filter != ''){
                pat = 'wb(set|create|remove)(claims?|qualifier|references?)-(set|add|create|update|remove)(.*)(' + filter + ')\]';
            } else {
                pat = 'claim|qualifier|reference'
            }
        }
        loadTable();
    });

    $('html').on('submit', '#pagepile', function(e) {
        e.preventDefault();
        pagepile = $("[name='pagepile']").val()
        loadTable();
    });

	/* reload page */
	$('html').on('click', '.reload', function(e) {
        e.preventDefault();
		loadTable();
	});

	/* highlight all edits of same user */
	$('html').on('mouseover', '.user', function() {
		if (mover == 0) $('.user:contains("'+$(this).text()+'")').parent().parent().parent().css('background-color','#FFCE7B');
	});
	$('html').on('mouseout', '.user', function() {
		if (mover == 0)	$('.user:contains("'+$(this).text()+'")').parent().parent().parent().css('background-color','');

	});

	/* remove hovercards */
	$('html').on('click',function(e){
		$("#hovercard").hide();
		$("#hovercard2").hide();
		mover = 0;
		$('tr').css('background-color','');
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

	/* patrol all edits (activated if edits sitelinks or moves are selected) */
	$('html').on('click','.patrolall',function(e){
		e.preventDefault();
        let patrolList = [];
		$('tr').each(function(){
			if ($(this).find('.title').attr('href') != undefined){
				qid = $(this).find('.title').attr('href').substring(24);
				revid = $(this).attr('id');
                patrolList.push([qid, revid]);
			}
		});
        patrolFromList(patrolList);
	});

	/* patrol all user edits */
	$('html').on('click','.patrolalluser',function(e){
		e.preventDefault();
		usertext = $(this).attr('data-usertext');
        let patrolList = [];
		$('.user:contains("'+usertext+'")').parent().parent().parent().each(function(){
			if ($(this).find('.title').attr('href') != undefined){
				qid = $(this).find('.title').attr('href').substring(24);
				revid = $(this).attr('id');
                patrolList.push([qid, revid]);
			}
		});
        patrolFromList(patrolList);
	});

	/* patrol or undo */
	$('html').on('click','.edit',function(e){
		e.preventDefault();
		qid = $(this).parent().parent().parent().find('.title').attr('href').substring(24);
		revid = $(this).parent().parent().parent().attr('id');
		usertext = $(this).parent().parent().parent().find('.user').text();
		patrol(qid,revid,$(this).text(),usertext);
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
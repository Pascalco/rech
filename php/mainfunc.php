<?php
/**
 * To the extent possible under law, the author(s) have dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide. This software is distributed without any warranty.
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the
 * CC0 Public Domain Dedication.
**/

/* do API request on wikidata.org/w/api.php
 *
 * @param  array $args	arguments to pass
 * @return object.
*/
function apiRequest(array $args) {
	$url = "https://www.wikidata.org/w/api.php?".http_build_query($args);
	$response = file_get_contents($url);
	$ret = json_decode($response);
	if ($ret === null) {
		echo 'Unparsable API response: <pre>' . htmlspecialchars( $ret ) . '</pre>';
		exit(0);
	}
	return $ret;
}

/* get label from wbgetentities
 *
 * @param  string $qlist	list of all Qids of which the label is requested, separated by |
 * @return void.
*/
function requestLabels($qlist){
	global $userlang;
	global $labels;
	$req = apiRequest( array( 'format'=>'json','action'=>'wbgetentities','ids'=>$qlist,'props'=>'labels','languages'=>$userlang,'languagefallback'=>'1' ) );
	if ( !isset( $labels ) ) $labels = $req->entities;
	else $labels =(object)( array_merge( (array) $labels,(array) $req->entities ) );
}

/* get label from $labels
 *
 * @param  string $qid	Qid
 * @return string.
*/
function getLabel($qid){
	global $userlang;
	global $labels;
	if (isset($labels->$qid->labels->$userlang->value)){
		return $labels->$qid->labels->$userlang->value;
	}
	return $qid;
}

/* check if item is rediect
 *
 * @param  string $qid	Qid
 * @return string.
*/
function getRedirect($qid){
	global $labels;
	if ($labels->$qid->id != $qid) return $labels->$qid->id;
	return False;
}

/* parse wiki syntax
 *
 * @param  string $comment	comment to parse
 * @return string.
*/
function parse($comment){
	$comment = preg_replace('/\[\[([^\]]+)\|([^\]]+)\]\]/','<a href="//www.wikidata.org/wiki/$1">$2</a>',$comment);
	return preg_replace('/\[\[([^\]]+)\]\]/','<a href="//www.wikidata.org/wiki/$1">$1</a>',$comment);
}

/* add links to properties with url formatter (P1630), image file on commons, url data type with http protocol
 *
 * @param  string $p	property id
 * @param  string $val	property value
 * @return string.
*/
function urlFormatter($p, $val){
    global $formatter;
    $comment = '';
    if (array_key_exists($p, $formatter)){
        if ($formatter[$p]['type'] == 'Url'){
            $val = '<a href="'.$val.'">'.$val.'</a>';
        } else if ($formatter[$p]['type'] == 'CommonsMedia'){
            $val  = '<a href="#" class="image">'.$val.'</a>';
        } else if (($formatter[$p]['type'] == 'ExternalId' || $formatter[$p]['type'] == 'String') && array_key_exists('formatterurl', $formatter[$p])){
            $val = '<a href="'.str_replace('$1', htmlspecialchars($val), $formatter[$p]['formatterurl']).'">'.$val.'</a>';
        }
        if (array_key_exists('regex', $formatter->$p)){
            if (!preg_match('/^'.$regexP[$p].'$/', $val, $match))$comment = ' <span class="red"><small>format violation</small></span>';
        }
    } else if (preg_match('/\[\[(Q[0-9]+)(\|Q[0-9]+)?\]\]/',$val, $match)){
		$val =  '<a href="//www.wikidata.org/wiki/'.$match[1].'">'.getLabel($match[1]).'</a>';
    }
    return $val.$comment;
}


/* add wikilinks
 *
 * @param  string $wiki	site name
 * @param  string $page page name
 * @return string.
*/
function wikilink($wiki,$page){
	if ($wiki == 'commonswiki'){
		return '<a href="//commons.wikimedia.org/wiki/'.$page.'">'.$page.'</a>';
	}
	if (substr($wiki,-4) == "wiki"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-4));
		return '<a href="//'.$wikicode.'.wikipedia.org/wiki/'.$page.'">'.$page.'</a>';
	}else if (substr($wiki,-9) == "wikiquote"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-9));
		return '<a href="//'.$wikicode.'.wikiquote.org/wiki/'.$page.'">'.$page.'</a>';
	}else if (substr($wiki,-8) == "wikinews"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-8));
		return '<a href="//'.$wikicode.'.wikinews.org/wiki/'.$page.'">'.$page.'</a>';
	}else if (substr($wiki,-10) == "wikivoyage"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-10));
		return '<a href="//'.$wikicode.'.wikivoyage.org/wiki/'.$page.'">'.$page.'</a>';
	}else if (substr($wiki,-9) == "wikibooks"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-9));
		return '<a href="//'.$wikicode.'.wikibooks.org/wiki/'.$page.'">'.$page.'</a>';
	}else if (substr($wiki,-10) == "wikisource"){
		$wikicode = str_replace('_','-',substr($wiki,0,strlen($wiki)-10));
		return '<a href="//'.$wikicode.'.wikisource.org/wiki/'.$page.'">'.$page.'</a>';
	}else{
		return $page;
	}
}

/* shorten the edit comment to 100 characters
 *
 * @param  string $term	term to short
 * @return string.
*/
function shorten($term){
	if (strlen($term) > 100){
		return substr($term,0,99).'...';
	}
	return $term;
}


/* parse edit comments
 *
 * @param  string $comment	comment to parse
 * @return string.
*/
function parsedComment($comment){
    $comment = htmlspecialchars($comment);
	/* claims */
	if (preg_match('/\/\* wb(set|create)claim-create:[0-9]\|\|?[0-9]* \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Created claim: </span><a href="//www.wikidata.org/wiki/P:'.$match[2].'">'.getLabel($match[2]).'</a>: '.urlFormatter($match[2],$match[4]);
	}else if (preg_match('/\/\* wbremoveclaims-remove:1\| \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed claim: </span><a href="//www.wikidata.org/wiki/P:'.$match[1].'">'.getLabel($match[1]).'</a>: '.urlFormatter($match[1],$match[3]);
	}else if (preg_match('/\/\* wb(set|create)claim-update:[0-9]\|?\|[0-9]*\|?[0-9]* \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed claim: </span><a href="//www.wikidata.org/wiki/P:'.$match[2].'">'.getLabel($match[2]).'</a>: '.urlFormatter($match[2],$match[4]);
	}else if (preg_match('/\/\* wbsetqualifier-add:[0-9]\| \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added qualifier: </span><a href="//www.wikidata.org/wiki/P:'.$match[1].'">'.getLabel($match[1]).'</a>: '.urlFormatter($match[1],$match[3]);
	}else if (preg_match('/\/\* wbsetreference-(set|add):[0-9]\| \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added reference: </span><a href="//www.wikidata.org/wiki/P:'.$match[2].'">'.getLabel($match[2]).'</a>: '.urlFormatter($match[2],$match[4]);
	}else if (preg_match('/\/\* wbremovereferences-remove:[0-9]\|\|[0-9] \*\/ \[\[Property:(P[0-9]+)(\|P[0-9]+)?\]\]: (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed reference from claim: </span><a href="//www.wikidata.org/wiki/P:'.$match[1].'">'.getLabel($match[1]).'</a>: '.urlFormatter($match[1],$match[3]);
		/* terms */
	}else if (preg_match('/\/\* wbsetdescription-add:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added ['.$match[1].'] description: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetlabel-add:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added ['.$match[1].'] label: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetaliases-add:[0-9]+\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added ['.$match[1].'] alias: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetdescription-set:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed ['.$match[1].'] description: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetlabel-set:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed ['.$match[1].'] label: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetaliases-set:[0-9]+\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed ['.$match[1].'] alias: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetdescription-remove:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed ['.$match[1].'] description: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetlabel-remove:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed ['.$match[1].'] label: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetaliases-remove:[0-9]+\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed ['.$match[1].'] alias: </span>'.shorten($match[2]);
	}else if (preg_match('/\/\* wbsetlabeldescriptionaliases:[0-9]+\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed ['.$match[1].'] label, description and aliases: </span>'.shorten($match[2]);
	/* sitelinks */
	}else if (preg_match('/\/\* wbsetsitelink-add:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Added link to ['.$match[1].']: </span>'.wikilink($match[1],$match[2]);
	}else if (preg_match('/\/\* wbsetsitelink-set:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Changed link to ['.$match[1].']: </span>'.wikilink($match[1],$match[2]);
	}else if (preg_match('/\/\* clientsitelink-update:0\|(.*)\|(.*)\|(.*)(\s\*\/|\.\.\.)/',$comment,$match) == 1){
		return '<span class="gray">Page moved from ['.$match[2].'] to ['.$match[3].'] </span>';
	}else if (preg_match('/\/\* clientsitelink-remove:1\|\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Page on ['.$match[1].'] deleted: </span>'.wikilink($match[1],$match[2]);
	}else if (preg_match('/\/\* wbsetsitelink-remove:1\|(.*) \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Removed link to ['.$match[1].']: </span>'.wikilink($match[1],$match[2]);
	}else if (preg_match('/\/\* wbsetsitelink-add-both:[0-9]\|(.*) \*\/ (.*), \[\[(Q[0-9]+)\]\]/',$comment,$match) == 1){
		return '<span class="gray">Added link and badges for ['.$match[1].']: </span>'.wikilink($match[1],$match[2]).' <a href="//www.wikidata.org/wiki/'.$match[3].'">'.$match[3].'</a>';
	}else if (preg_match('/\/\* wbsetsitelink-set-both:[0-9]\|(.*) \*\/ (.*), \[\[(Q[0-9]+)\]\]/',$comment,$match) == 1){
		return '<span class="gray">Changed link and badges for ['.$match[1].']: </span>'.wikilink($match[1],$match[2]).' <a href="//www.wikidata.org/wiki/'.$match[3].'">'.$match[3].'</a>';
	/* merge */
	}else if (preg_match('/\/\* wbmergeitems-from:0\|\|(Q[0-9]+) \*\//',$comment,$match) == 1){
		return '<span class="gray">Merged item from "'.$match[1].'"</span>';
	}else if (preg_match('/\/\* wbmergeitems-to:0\|\|(Q[0-9]+) \*\//',$comment,$match) == 1){
		return '<span class="gray">Merged item into "'.$match[1].'"</span>';
	/* various */
	}else if (preg_match('/\/\* wbeditentity-create:(.*) \*\/(.*)/',$comment,$match) == 1){
		return '<span class="gray">Created new item: </span>'.$match[2];
	}else if (preg_match('/\/\* wbeditentity-update:[0-9]\| \*\/ (.*)/',$comment,$match) == 1){
		return '<span class="gray">Updated item: </span>'.parse($match[1]);
	}else if (preg_match('/\/\* wbcreateredirect:0\|\|(Q[0-9]+)\|(Q[0-9]+) \*\//',$comment,$match) == 1){
		return '<span class="gray">Redirected to: </span><a href="//www.wikidata.org/wiki/'.$match[2].'">'.getLabel($match[2]).'</a>';
	}else if (preg_match('/\/\* wbeditentity-override:0\| \*\/(.*)/',$comment,$match) == 1){
		return '<span class="gray">Cleared an item: </span>'.parse($match[1]);
	}else if (preg_match('/\/\* undo:0\|\|([0-9]+)\|(.*) \*\/(.*)/',$comment,$match) == 1){
		return '<span class="gray">Undo revision '.$match[1].' by '.$match[2].'</span>';
	}else{
		return parse($comment);
	}
}
?>

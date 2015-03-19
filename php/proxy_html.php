<?php
/**
 * To the extent possible under law, the author(s) have dedicated all copyright 
 * and related and neighboring rights to this software to the public domain 
 * worldwide. This software is distributed without any warranty. 
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the 
 * CC0 Public Domain Dedication.
 
 script used to display diffs
**/
header('Content-type: text/plain');

$url = 'https://www.wikidata.org/w/index.php?';
foreach($_GET as $k => $v){
  $v2 = str_replace(' ','_',$v);
  $url.=$k.'='.$v2.'&';
}

$options = array( 'http' => array(
	'user_agent'    => 'spider',
	'max_redirects' => 10,
	'timeout'       => 120,
) );
$context = stream_context_create( $options );
echo @str_replace('href="/wiki/','href="//www.wikidata.org/wiki/',@file_get_contents( $url, false, $context));
?>
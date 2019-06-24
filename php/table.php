<?php
/**
 * To the extent possible under law, the author(s) have dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide. This software is distributed without any warranty.
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the
 * CC0 Public Domain Dedication.
**/
include("../../connect.inc.php");
include("../../oauth.php");

$userlang = $_GET['userlang'];
include("mainfunc.php");

//load datatypes, url formatter (P1630) and regex(P1793) from file
$str = file_get_contents("../statements/statements.json");
$formatter = json_decode($str, true);

$importantItems = file_get_contents("../statements/importantItems.dat");


/* START MAIN PART */
echo '<div id="hovercard"></div><div id="hovercard2"></div><table id="main">';
echo '<tr class="rightside"><td colspan="5"><a class="reload" href="#" target="_parent">reload</a></td></tr>';

$olddate = 0;
if (isset($res->query->userinfo->options->timecorrection)){
	$arr = explode('|',$res->query->userinfo->options->timecorrection);
	$timecorrection = $arr[1]*60;
}else{
	$timecorrection = 0;
}

$addQuery = '';
if ($_GET['itemtype'] > 0){
    $addQuery = ' AND rc_title IN ('.$importantItems.') ';
} else if ($_GET['itemtype'] == 'pp'){
    $context  = stream_context_create(array('http' => array('user_agent' => 'reCh tool')));
    $str = file_get_contents('https://tools.wmflabs.org/pagepile/api.php?id='.$_GET['pagepile'].'&action=get_data&doit&format=json', false, $context);
    $pagepile = json_decode($str, true);
    if ($pagepile['wiki'] == 'wikidatawiki'){
        $addQuery = ' AND rc_title IN ("'.implode('","', $pagepile['pages']).'") ';
    }
}
$result = mysqli_query($conn, "SELECT rc_this_oldid, rc_timestamp, rc_title, rc_old_len, rc_new_len, actor_name, comment_text FROM recentchanges JOIN comment ON rc_comment_id = comment_id JOIN actor ON rc_actor = actor_id WHERE rc_patrolled=0 AND rc_namespace=0 AND comment_text REGEXP '".$_GET['pat']."' ".$addQuery." ORDER BY rc_timestamp DESC LIMIT ".$_GET['limit']);

/* request all labels */
$qarray = array();
while ($m = mysqli_fetch_assoc($result)){
	array_push($qarray,$m['rc_title']);
	if (preg_match('/\[\[Property:(P[0-9]+)(\||\])/',$m['comment_text'],$match) == 1)array_push($qarray,$match[1]);
	if (preg_match('/\[\[(Q[0-9]+)(\||\])/',$m['comment_text'],$match) == 1)array_push($qarray,$match[1]);
}
$qarray = array_unique($qarray);
for($i=0;$i<ceil(count($qarray)/50);$i++)requestLabels(implode('|',array_slice($qarray,$i*50,50)));
mysqli_data_seek($result, 0);

/*create table */
while ($m = mysqli_fetch_assoc($result)){
	$time = strtotime($m['rc_timestamp'])+$timecorrection;
	$size = $m['rc_new_len']-$m['rc_old_len'];
	$date = date("Y-m-d",$time);
	if ($date != $olddate){
		echo '<tr class="trhead"><td colspan="5"><h3>'.$date.'</h3></td></tr>';
		$olddate = $date;
	}
	$tempLabel = getLabel($m['rc_title']);
	$label = ( $tempLabel != $m['rc_title'] ) ? $tempLabel : '';
	$redirect = getRedirect($m['rc_title']);
	echo '<tr id="'.$m['rc_this_oldid'].'" data-qid="'.$m['rc_title'].'">';
	echo '<td><a class="title" href="//www.wikidata.org/wiki/'.$m['rc_title'].'">'.$label.' <small>('.$m['rc_title'].')</small></a>';
	if ($redirect) echo ' <small>redirects to <a href="//www.wikidata.org/wiki/'.$redirect.'">'.$redirect.'</a></small>';
	echo '</td><td><span class="comment">'.parsedComment($m['comment_text']).'</span>';
	if ($size>0) echo ' (<span class="green" dir="ltr">+'.$size.'</span>)</td>';
	else echo ' (<span class="red" dir="ltr">'.$size.'</span>) </td>';
	echo '<td><div class="nlb"><a class="user" href="#">'.$m['actor_name'].'</a></div></td>';
	echo '<td>'.date("H:i",$time).'</td>';
	echo '<td><div class="nlb buttons"><a class="diffview blue" href="#">diff</a>';
	echo '<a class="edit green" href="#">patrol</a>';
	echo '<a class="edit red" href="#">undo</a></div></td></tr>';
}
echo '<tr><td colspan="4"></td><td style="text-align:right;"><a class="patrolall" href="#">patrol all edits</a></td></tr>';
echo '<tr class="rightside"><td colspan="5"><a class="reload" href="#" target="_parent">reload</a></td></tr></table>';
mysqli_close($conn);
?>

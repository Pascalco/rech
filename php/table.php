<?php
/**
 * To the extent possible under law, the author(s) have dedicated all copyright 
 * and related and neighboring rights to this software to the public domain 
 * worldwide. This software is distributed without any warranty. 
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the 
 * CC0 Public Domain Dedication.
**/
 
include("connect.php");
include("oauth.php");
$res = getUserInfo();
if (isset($res->query->userinfo->options->language)){
	$userlang = $res->query->userinfo->options->language;
}else{
	$userlang = 'en';
}
include("mainfunc.php");
session_start();

//load url formatter (P1630) from file
$file1 = "../statements/url.dat";
$lines = file($file1);
$urls = array();
foreach($lines as $line_num => $line){
	$ble = explode('|',$line);
	$urls[$ble[0]] = trim($ble[1]);
}

//load format constraints from file
$file1 = "../statements/regex.dat";
$lines = file($file1);
$regexP = array();
foreach($lines as $line_num => $line){
	$ble = explode('|',$line,2);
	$regexP[$ble[0]] = trim(str_replace('/','\/',$ble[1]));
}

/* START MAIN PART */
echo '<div id="hovercard"></div><div id="hovercard2"></div><table id="main">';
echo '<tr class="rightside"><td colspan="5"><a class="reload" href="#" target="_parent">reload</a></td></tr>';

$olddate = 0;
if (isset($res->query->userinfo->options->timecorrection)){
	$arr = explode('|',$res->query->userinfo->options->timecorrection);
	$timecorrection = $arr[1]*60;
}else{
	$timecorresiotn = 0;
}
$result = mysql_query("SELECT rc_this_oldid, rc_timestamp, rc_user_text, rc_title, rc_comment, rc_old_len, rc_new_len FROM recentchanges WHERE rc_patrolled=0 AND rc_namespace=0 AND rc_comment REGEXP '".$_SESSION['pat']."' ORDER BY rc_timestamp DESC LIMIT ".$_SESSION['limit']);
while ($m = mysql_fetch_assoc($result)){
	$time = strtotime($m['rc_timestamp'])+$timecorrection;
	$size = $m['rc_new_len']-$m['rc_old_len'];
	$date = date("Y-m-d",$time);
	if ($date != $olddate){
		echo '<tr class="trhead"><td colspan="5"><h3>'.$date.'</h3></td></tr>';
		$olddate = $date;
	}
	echo '<tr id="'.$m['rc_this_oldid'].'" data-qid="'.$m['rc_title'].'">';
	echo '<td><a class="title" href="//www.wikidata.org/wiki/'.$m['rc_title'].'">'.getLabel($m['rc_title']).' <small>('.$m['rc_title'].')</small></a></td>';
	echo '<td><span class="comment">'.parsedComment($m['rc_comment']).'</span>';
	if ($size>0) echo ' (<span class="green" dir="ltr">+'.$size.'</span>)</td>';
	else echo ' (<span class="red" dir="ltr">'.$size.'</span>) </td>';
	echo '<td><div class="nlb"><a class="user" href="#">'.$m['rc_user_text'].'</a></div></td>';
	echo '<td>'.date("H:i",$time).'</td>';
	echo '<td><div class="nlb buttons"><a class="diffview blue" href="#">diff</a>';
	echo '<a class="edit green" href="#">patrol</a>';
	echo '<a class="edit red" href="#">undo</a></div></td></tr>';	
}
//add patroll-all only if edited sitelinks or page moves are selected
if ($_SESSION['pat'] == 'clientsitelink-update' or $_SESSION['pat'] == 'wbsetsitelink') echo '<tr><td colspan="4"></td><td style="text-align:right;"><a class="patrolall" href="#">patrol all edits</a></td></tr>';
mysql_close($conn1);
echo '<tr class="rightside"><td colspan="5"><a class="reload" href="#" target="_parent">reload</a></td></tr></table>';
?>
<?php
/**
 * To the extent possible under law, the author(s) have dedicated all copyright 
 * and related and neighboring rights to this software to the public domain 
 * worldwide. This software is distributed without any warranty. 
 *
 * See <http://creativecommons.org/publicdomain/zero/1.0/> for a copy of the 
 * CC0 Public Domain Dedication.
**/
 
include("php/connect.php");
include("php/oauth.php");
include("php/mainfunc.php");
session_start();

//logout
switch ( isset( $_GET['action'] ) ? $_GET['action'] : '' ){
	case 'logout':
		logout();
		$logout = 1;
		break;
}

//display options
if (isset($_GET['show'])){
	$_SESSION['show'] = $_GET['show'];
	switch($_GET['show']){
		case 'all':$_SESSION['pat']='.';break;
		case 'terms':$_SESSION['pat']='label|description|alias';break;
		case 'claims':$_SESSION['pat']='claim|qualifier|reference';break;
		case 'sitelinks':$_SESSION['pat']='wbsetsitelink';break;
		case 'merges':$_SESSION['pat']='merge';break;
		case 'moves':$_SESSION['pat']='clientsitelink-update';break;
		case 'new':$_SESSION['pat']='wbeditentity-create:';break;
		default: $_SESSION['pat']='.';
	}
}else if (!isset($_SESSION['pat'])){
	$_SESSION['pat']='.';
	$_SESSION['show']='';
}

if (isset($_GET['reload'])){
	$_SESSION['reload'] = $_GET['reload'];
}else if (!isset($_SESSION['reload'])){
	$_SESSION['reload']='0';
}

if (isset($_GET['limit'])){
	if ($_GET['limit'] <= 100){
		$_SESSION['limit'] = $_GET['limit'];
	}
}else if (!isset($_SESSION['limit'])){
	$_SESSION['limit'] = 50;
}

$choiceLimit = array('25'=>'25 edits','50'=>'50 edits','100'=>'100 edits');
$choiceReload = array('60' => '1 minute','300' => '5 minutes','600' => '10 minutes');
$choiceShow = array('terms' => 'terms','claims' => 'claims','sitelinks' => 'sitelinks', 'merges' => 'merges', 'moves'=>'page moves', 'new'=>'new items');
?>
<!doctype html>
<html>
<head>
<title>Wikidata Recent Changes</title>
<meta charset="utf-8">
<link href="css/main.css" type="text/css" rel="stylesheet">
<link href="css/navi.css" type="text/css" rel="stylesheet">
<script src="https://code.jquery.com/jquery-1.11.2.min.js"></script>
<script  type="text/javascript" src="rc.js"></script>
<base target="_blank" />

<script>
$(document).ready(function() {
	loadTable();
});
<?PHP
if ($_SESSION['reload'] != 0)echo "window.setInterval(function(){\n\tloadTable()\n},".($_SESSION['reload']*1000).");\n";
?>	
</script>

</head>
<body>
<?php
/* nav boxes */
echo '<div class="nav">'.
  '<ul class="nav-list leftbox"><li class="nav-item">'.
  'This is a filtered version of <a href="//www.wikidata.org/wiki/Special:RecentChanges" class="normallink">Special:RecentChanges</a> on Wikidata. Only unpatrolled edits are shown.'.
  '</li>'.
  '<li class="nav-item"><span>Query only </span><ul class="nav-submenu">';
foreach ($choiceShow as $key => $val){
	if ($key == $_SESSION['show']) echo '<li class="nav-submenu-item"><a class="inactive">'.$val.'</a></li>';
	else echo '<li class="nav-submenu-item"><a href="?show='.$key.'" target="_parent">'.$val.'</a></li>';
}
if ($_SESSION['pat'] != '.') echo '<li class="nav-submenu-item"><a href="?show=all" target="_parent">display all edits</a></li>';
echo '</ul></li>'.
  '<li class="nav-item"><span>Show last </span><ul class="nav-submenu">';
foreach ($choiceLimit as $key => $val){
	if ($key == $_SESSION['limit']) echo '<li class="nav-submenu-item"><a class="inactive">'.$val.'</a></li>';
	else echo '<li class="nav-submenu-item"><a href="?limit='.$key.'" target="_parent">'.$val.'</a></li>';
}
echo '</ul></li>'.
  '<li class="nav-item"><span>Reload after </span><ul class="nav-submenu">';
foreach ($choiceReload as $key => $val){
	if ($key == $_SESSION['reload']) echo '<li class="nav-submenu-item"><a class="inactive">'.$val.'</a></li>';
	else echo '<li class="nav-submenu-item"><a href="?reload='.$key.'" target="_parent">'.$val.'</a></li>';
}
if ($_SESSION['reload'] != 0) echo '<li class="nav-submenu-item"><a href="?reload=0" target="_parent">no auto-reload</a></li>';
echo '</ul></li>'.
  '</ul><ul class="nav-list rightbox">';
$res = getUserInfo();
if (!isset($res->error) and !isset($logout)){
	echo '<li class="nav-item"><span><a href="?action=logout" target="_parent">logout</a></span></li>'.
	  '<li class="nav-item"><span><a href="//www.wikidata.org/wiki/Special:Contributions/'.$res->query->userinfo->name.'">your edits</a></span></li>'.
	  '<li class="nav-item"><span><a href="//www.wikidata.org/w/index.php?title=Special:Log&type=patrol&user='.$res->query->userinfo->name.'">your patrols</a></span></li>';
}else{
	echo '<li class="nav-item"><span><a href="../index.php?action=authorize" target="_parent">login</a></span></li>';
}
echo '</ul></div>';


/* STATUS CHECK */
$result = mysql_query("SELECT rc_timestamp FROM recentchanges ORDER BY rc_timestamp DESC LIMIT 1");
$m = mysql_fetch_assoc($result);
$timelag = time()-mktime(substr($m['rc_timestamp'],8,2),substr($m['rc_timestamp'],10,2),substr($m['rc_timestamp'],12,2),substr($m['rc_timestamp'],4,2),substr($m['rc_timestamp'],6,2),substr($m['rc_timestamp'],0,4)); #not necessary lag, only time elapsed since last edit
if ($timelag > 10) echo '<div class="warning">Warning: Edits of the last '.$timelag.' seconds are missing</div>';
?>
<div id="show"></div>
<div id="load">loading <img src="pic/loader.gif" width="20" alt="" /></div>

</body>
</html>
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

//logout
switch ( isset( $_GET['action'] ) ? $_GET['action'] : '' ){
	case 'logout':
		logout();
		$logout = 1;
		break;
}
?>

<!doctype html>
<html>
<head>
<title>Wikidata Recent Changes</title>
<meta charset="utf-8">
<link href="css/main.css" type="text/css" rel="stylesheet">
<link href="css/navi.css" type="text/css" rel="stylesheet">
<script src="//tools-static.wmflabs.org/static/jquery/1.11.0/jquery.min.js"></script>
<?php
    $commit = trim(file_get_contents( '../rech/.git/refs/heads/master' ));
?>
<script src="rc.js?version=<?php echo $commit; ?>"></script>
<base target="_blank" />
</head>

<body>
<div class="nav"></div>

<?php
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

<?PHP
$file = '/data/project/pltools/replica.my.cnf';

$config = file_get_contents($file);
$lines = explode("\n",$config);

foreach($lines AS $line){
	if (strpos($line,'=') == false) continue;
	$foo = explode('=',$line);
	$foo[1] = trim(str_replace("'","",$foo[1]));
	if (trim($foo[0]) == 'user') $username = $foo[1];
	if (trim($foo[0]) == 'password') $password = $foo[1];
}

$conn1 = mysql_connect("enwiki.labsdb",$username,$password) OR die("no connection");
mysql_select_db("wikidatawiki_p",$conn1) OR die("no database");
?>

<?PHP
$file = '/data/project/pltools/replica.my.cnf';

$config = parse_ini_file($file);

$conn1 = mysql_connect("enwiki.labsdb",$config['user'],$config['password']) OR die("no connection");
mysql_select_db("wikidatawiki_p",$conn1) OR die("no database");
?>

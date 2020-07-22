<?php
if (isset($_GET['token'])){
    setcookie('plnodeJwt', $_GET['token'], time() + (86400 * 30), '/');
    header('Location: index.php');
    
} else {
    print('error');
}
?>
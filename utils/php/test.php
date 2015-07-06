<?php

include_once("ProductService.Affilinet.php");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the product data web services password

$ps= new ProductService();
$ps->Affilinet("512499","FaI69alVX0eZ4i28TnIq",'Product');
    
$result = $ps->GetShopList(); 
echo json_encode($result);

?>
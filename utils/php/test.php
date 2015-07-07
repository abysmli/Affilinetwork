<?php

include_once("ProductService.Affilinet.php");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the product data web services password

$ps= new ProductService();
$ps->Affilinet("512499","FaI69alVX0eZ4i28TnIq",'Product');

//$result = $ps->GetCategoryList(0);
$result = $ps->SearchProducts(array(0, 10), '', false, true, 'AllImages', 1, 30);
echo json_encode($result);

?>


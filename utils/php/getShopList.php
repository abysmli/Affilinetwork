#!/usr/bin/env php
<?php

include_once("ProductService.Affilinet.php");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the product data web services password

$ps= new ProductService();
$ps->Affilinet($Username, $Password, 'Product');
    
$result = $ps->GetShopList(); 
echo json_encode($result);

?>
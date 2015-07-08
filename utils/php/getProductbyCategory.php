#!/usr/bin/env php
<?php

include_once("ProductService.Affilinet.php");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the product data web services password
$CategoryID = $argv[3];
$CurrentPage = $argv[4];
$Pagesize = $argv[5];

$ps= new ProductService();
$ps->Affilinet($Username, $Password, 'Product');

$result = $ps->SearchProductsInCategories(array(0, 10), array($CategoryID), true, '', false, true, 'AllImages', $CurrentPage, $Pagesize);
echo json_encode($result);

?>
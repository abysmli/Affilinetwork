#!/usr/bin/env php
<?php

define ("WSDL_LOGON", "http://product-api.affili.net/Authentication/Logon.svc?wsdl");
define ("WSDL_PROD",  "http://product-api.affili.net/V3/WSDLFactory/Product_ProductData.wsdl");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the product data web services password

$SOAP_LOGON = new SoapClient(WSDL_LOGON);
$Token = $SOAP_LOGON->Logon(array(
    'Username'  => $Username,
    'Password'  => $Password,
    'WebServiceType' => 'Product'
));

$SOAP_REQUEST = new SoapClient(WSDL_PROD);
$req = $SOAP_REQUEST->GetShopList(array(
    'PublisherId' => $Username,
    'CredentialToken' => $Token,
    'LogoScale' => 'Logo120',
    'PageSettings' => array(
        'CurrentPage' => '1',
        'PageSize' => '5000'
    )
));

echo json_encode($req);
#!/usr/bin/env php
<?php

define ("WSDL_LOGON", "https://api.affili.net/V2.0/Logon.svc?wsdl");
define ("WSDL_STATS",  "https://api.affili.net/V2.0/PublisherStatistics.svc?wsdl");

$Username = $argv[1]; // the publisher ID
$Password = $argv[2]; // the publisher data web services password
$StartTimestamp = $argv[3];
$EndTimestamp = $argv[4];

$SOAP_LOGON = new SoapClient(WSDL_LOGON);
$Token      = $SOAP_LOGON->Logon(array(
    'Username'  => $Username,
    'Password'  => $Password,
    'WebServiceType' => 'Publisher'
));

$params = array(
    'ProgramId' => '0',
    'StartDate' => intval($StartTimestamp),
    'EndDate' => intval($EndTimestamp)
);

$SOAP_REQUEST = new SoapClient(WSDL_STATS);
$req = $SOAP_REQUEST->GetSalesLeadsBySubIdPerDay(array(
            'CredentialToken' => $Token,
            'GetSalesLeadsBySubIdPerDayRequestMessage' => $params
            ));

echo json_encode($req);
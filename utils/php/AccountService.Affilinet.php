<?php

include_once("Affilinet.php");

class AccountService extends Affilinet
{

	/**
	 * variable für den Soap Request
	 *
	 * @var SOAP
	 */
	private $soap_request;

	/**
	 * Konstruktor
	 *
	 * @return ProductServices
	 */
	public function AccountService()
	{

	}
    
    public function GetLinkedAccounts()
    {
        $this->soap_request = new SoapClient(WSDL_AW_WS);
        $req = $this->soap_request->GetLinkedAccountRequest(array(
            'CredentialToken' => parent::getToken(),
            'PublisherId' => parent::getPublisherID()
        ));
        return $req;
    }
}
?>
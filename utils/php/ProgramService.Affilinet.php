<?php
include_once("Affilinet.php");

class ProgramService extends Affilinet
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
	public function ProgramService()
	{

	}
    
    public function GetAllPrograms($query)
    {
        $params = array(
            'Query' => $query
        );
		$this->soap_request = new SoapClient(WSDL_SW_WS);
		$req = $this->soap_request->GetAllPrograms(array(
            'CredentialToken' => parent::getToken(),
            'GetProgramsRequestMessage' => $params
		));
		return $req;
    }
}
?>
<?php
include_once("Affilinet.php");

class StatistikService extends Affilinet
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
	public function StatistikService()
	{

	}
    
    public function GetClicksBySubIdPerDay($startdate, $enddate, $usegrossvalues, $programid)
    {
        $params = array(
            'StartDate' => $startdate,
            'EndDate' => $enddate,
            'UseGrossValues' => $usegrossvalues,
            'ProgramId' => $programid
		);

		$this->soap_request = new SoapClient(WSDL_SW_WS);
		$req = $this->soap_request->GetClicksBySubIdPerDay(array(
            'CredentialToken' => parent::getToken(),
            'GetClicksBySubIdPerDayRequestMessage' => $params
		));
		return $req;
    }
}
?>
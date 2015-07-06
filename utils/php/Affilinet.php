<?php

class Affilinet
{
	/**
	 * The authentification token you receive from the method Logon
	 *
	 * @var String
	 */
	private $token;
	private $username;
	private $password;
	private $demoPublisherId;
	private $serviceTyp;
	
	public function Affilinet($username,$password,$serviceTyp,$sandbox=false,$demoPublisherId=403233)
	{
		$this->username = $username;
		$this->password = $password;
		$this->demoPublicherId = $demoPublicherId;
		$this->serviceTyp = $serviceTyp;
		
		if($sandbox)
		{
			define ("WSDL_LOGON", "https://developer-api.affili.net/V2.0/Logon.svc?wsdl");
			define ("WSDL_PP_WS", "https://developer-api.affili.net/V2.0/PublisherProgram.svc?wsdl");	
			define ("WSDL_PS_WS", "https://developer-api.affili.net/V2.0/ProductServices.svc?wsdl");
            $this->sandboxLogon();
		}
		else 
		{
			define ("WSDL_LOGON", "https://api.affili.net/V2.0/Logon.svc?wsdl");
			define ("WSDL_PP_WS", "https://api.affili.net/V2.0/PublisherProgram.svc?wsdl");
            define ("WSDL_AW_WS", "https://api.affili.net/V2.0/AccountService.svc?wsdl");
            define ("WSDL_CW_WS", "https://api.affili.net/V2.0/PublisherCreative.svc?wsdl");
            define ("WSDL_IW_WS", "https://api.affili.net/V2.0/PublisherInbox.svc?wsdl");
            define ("WSDL_SW_WS", "https://api.affili.net/V2.0/PublisherStatistics.svc?wsdl");
			define ("WSDL_PS_WS", "https://api.affili.net/V2.0/ProductServices.svc?wsdl");
			$this->liveLogon();
		}
		
	}
	
	private function liveLogon()
	{

		$SOAP_LOGON = new SoapClient(WSDL_LOGON);
		$this->token = $SOAP_LOGON->Logon(array(
             'Username'  => $this->username,
             'Password'  => $this->password,
             'WebServiceType' => $this->serviceTyp
        ));
	}
	
	private function sandboxLogon()
	{
		$DeveloperSettings = array('SandboxPublisherID' => $this->demoPublisherId);

		$SOAP_LOGON = new SoapClient(WSDL_LOGON);
	
		$this->token = $SOAP_LOGON->Logon(array(
                     'Username'  => $this->username,
                     'Password'  => $this->password,
                     'WebServiceType' => $this->serviceTyp,
                     'DeveloperSettings' => $DeveloperSettings
        ));
	}
    
    public function getPublisherID()
	{
        return $this->username;
    }
	
	public function getToken()
	{
		return $this->token;
	}	
}
?>
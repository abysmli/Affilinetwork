<?php

include_once("Affilinet.php");

class ProductService extends Affilinet
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
	public function ProductService()
	{

	}

	/**
	 * This method can be used to get all categories of a certain shop.
	 *
	 * @param int $shopId
	 * @return string
	 */
	public function GetCategoryList($shopId)
	{
		$params = array(
		'ShopId' => $shopId
		);

		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->GetCategoryList(array(
		'CredentialToken' => parent::getToken(),
		'GetCategoryListRequestMessage' => $params
		));
		return $req;
	}

	/**
	 * This method can be used to retrieve the path of a specific shop category: all categories up to the specified category are issued as an ordered list of category objects. This category list is included in the returned CategoryResultObject.
	 *
	 * @param int $shopId
	 * @param int $categoryId
	 * @return string
	 */
	public function GetCategoryPath($shopId,$categoryId)
	{
		$params = array(
		'ShopId' => $shopId,
		"CategoryId" => $categoryId
		);

		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->GetCategoryPath(array(
		'CredentialToken' => parent::getToken(),
		'GetCategoryPathRequestMessage' => $params
		));
		return $req;
	}
	
	/**
	 * This method can be used to retrieve detailed information on a specific product. The data available within the context of this offer include the fields "Price" and "DisplayPrice". To display the price on the screen, use the "DisplayPrice" field because this is the type of display requested by the program operator for his product(s). The partner is solely liable for correctly displaying the price(s) on his website. The same applies to the Shipping Price.
	 *
	 * @param int $productId
	 * @return string
	 */
	public function GetProductDetail($productId)
	{
		$params = array(
		'ProductId' => $productId
		);

		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->GetProductDetail(array(
		'CredentialToken' => parent::getToken(),
		'GetProductDetailRequestMessage' => $params
		));
		return $req;
	}

	/**
	 * This function returns product information for a list of specified product IDs. The presentation type can be set: if detailed presentation (parameter Details) is set to false, this considerably reduces the quantity of data transferred and therefore speeds up the search. The returned data includes the fields "Price" and "DisplayPrice". To display the price on the screen, use only the "DisplayPrice" field because this is the type of display requested by the program operator for his product(s). The partner is solely liable for correctly displaying the price(s) on his website. The same applies to the ShippingPrice.
	 *
	 * @param array $productIds
	 * @param bool $details
	 * @param enum $imageSize NoImage|Image30Logo50|Image60Logo90|Image90Logo120|Image120Logo150|Image150Logo180|AllImages
	 * @param int $currentPage
	 * @param int $pageSize
	 * @param enum $sortBy Price|Title|Rank
	 * @param enum $sortOrder Unsorted|Ascending|Descending|Random
	 * @return string
	 */
	public function GetProducts($productIds=array(),$details=true,$imageSize='AllImages',$currentPage=1,$pageSize=10,$sortBy='Rank',$sortOrder='Descending')
	{
		$params = array(
		'ProductIds' => $productIds,
		'Details' => $details,
		'ImageSize' => $imageSize,
		'CurrentPage' => $currentPage,
		'PageSize' => $pageSize,
		'SortBy' => $sortBy,
		'SortOrder' => $sortOrder
		);

		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->GetProducts(array(
		'CredentialToken' => parent::getToken(),
		'GetProductsRequestMessage' => $params
		));
		return $req;
	}

	/**
	 * This method returns all shops activated for the partner. The ShopList object contains a list of ShopListItem objects containing information about individual shops.
	 *
	 * @return string
	 */
	public function GetShopList()
	{
		$this->soap_request = new SoapClient(WSDL_PS_WS);

		$req = $this->soap_request->GetShopList(array(
            'CredentialToken' => parent::getToken()));
		return $req;
	}

	/**
	 * This method can be used to search individual shops for products. It is also possible to search within the products of all shops, with which you have a partnership. The returned data includes the fields "Price" and "DisplayPrice". To display the price on the screen, use only the "DisplayPrice" field because this is the type of display requested by the program operator for his product(s). The partner is solely liable for correctly displaying the price(s) on his website. The same applies to the ShippingPrice. 
	 *
	 * @param array $shopIds Ids of the shops on whose products the search shall be performed Note: use ShopId 0 to search in all shops you have a partnership with.
	 * @param string $query
	 * @param bool $withImageOnly
	 * @param bool $details
	 * @param enum $imageSize NoImage|Image30Logo50|Image60Logo90|Image90Logo120|Image120Logo150|Image150Logo180|AllImages
	 * @param int $currentPage
	 * @param int $pageSize
	 * @param decimal $minPrice
	 * @param decimal $maxPrice
	 * @param enum $sortBy Price|Title|Rank
	 * @param enum $sortOrder Unsorted|Ascending|Descending|Random
	 * @return string
	 */
	public function SearchProducts($shopIds=array(),$query='',$withImageOnly=false,$details=true,$imageSize='AllImages',$currentPage=1,$pageSize=10,$minPrice='0',$maxPrice='0',$sortBy='Rank',$sortOrder='Descending')
	{
		$params = array(
		'ShopIds' => $shopIds,
		'Query' => $query,
		'WithImageOnly' => $withImageOnly,
		'Details' => $details,
		'ImageSize' => $imageSize,
		'CurrentPage' => $currentPage,
		'PageSize' => $pageSize,
		'MinimumPrice' => $minPrice,
		'MaximumPrice' => $maxPrice,
		'SortBy' => $sortBy,
		'SortOrder' => $sortOrder
		);

		$this->soap_request = new SoapClient(WSDL_PS_WS);
		
		$req = $this->soap_request->SearchProducts(array(
		'CredentialToken' => parent::getToken(),
		'SearchProductsRequestMessage' => $params
		));
		
		return $req;
	}

	/**
	 * This method can be used to search for products in several categories. It can also be stated whether the specified category is an affilinet® category. The returned data includes the fields "Price" and "DisplayPrice". To display the price on the screen, use only the "DisplayPrice" field because this is the type of display requested by the program operator for his product(s). The partner is solely liable for correctly displaying the price(s) on his website. The same applies to the ShippingPrice. 
	 *
	 * @param array $shopIds Ids of the shops on whose products the search shall be performed Note: use ShopId 0 to search in all shops you have a partnership with.
	 * @param array $categoriesIds
	 * @param bool $useAffilinetCategories
	 * @param string $query	 
	 * @param bool $withImageOnly
	 * @param bool $details
	 * @param enum $imageSize NoImage|Image30Logo50|Image60Logo90|Image90Logo120|Image120Logo150|Image150Logo180|AllImages
	 * @param int $currentPage
	 * @param int $pageSize
	 * @param decimal $minPrice
	 * @param decimal $maxPrice
	 * @param enum $sortBy Price|Title|Rank
	 * @param enum $sortOrder Unsorted|Ascending|Descending|Random
	 * @return string
	 */
	public function SearchProductsInCategories($shopIds=array(),$categoriesIds=array(),$useAffilinetCategories=false,$query='',$withImageOnly=false,$details=true,$imageSize='AllImages',$currentPage=1,$pageSize=10,$minPrice='0',$maxPrice='0',$sortBy='Rank',$sortOrder='Descending')
	{
		$params = array(
		'ShopIds' => $shopIds,
		'CategoryIds' => $categoriesIds,
		'UseAffilinetCategories' => $useAffilinetCategories,
		'Query' => $query,
		'WithImageOnly' => $withImageOnly,
		'Details' => $details,
		'ImageSize' => $imageSize,
		'CurrentPage' => $currentPage,
		'PageSize' => $pageSize,
		'MinimumPrice' => $minPrice,
		'MaximumPrice' => $maxPrice,
		'SortBy' => $sortBy,
		'SortOrder' => $sortOrder
		);


		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->SearchProductsInCategories(array(
		'CredentialToken' => parent::getToken(),
		'SearchProductsInCategoriesRequestMessage' => $params
		));
		return $req;
	}

	/**
	 * This method can be used to find products within a list of specific categories. It is also possible to define whether all subcategories should be searched or only the one specified. It can also be stated whether the specified category is an affilinet® category. The data available within the context of this offer include the fields "Price" and "DisplayPrice". To display the price on the screen, use only the "DisplayPrice" field because this is the type of display requested by the program operator for his product(s). The partner is solely liable for correctly displaying the price(s) on his website. The same is also true for the Shipping Price. 
	 *
	 * @param int $shopId
	 * @param int $categoryId
	 * @param bool $includeChildNodes
	 * @param bool $useAffilinetCategories
	 * @param string $query	 
	 * @param bool $withImageOnly
	 * @param bool $details
	 * @param enum $imageSize NoImage|Image30Logo50|Image60Logo90|Image90Logo120|Image120Logo150|Image150Logo180|AllImages
	 * @param int $currentPage
	 * @param int $pageSize
	 * @param decimal $minPrice
	 * @param decimal $maxPrice
	 * @param enum $sortBy Price|Title|Rank
	 * @param enum $sortOrder Unsorted|Ascending|Descending|Random
	 * @return string
	 */
	public function SearchProductsInCategory($shopId='',$categoryId='',$includeChildNodes=false,$useAffilinetCategories=false,$query='',$withImageOnly=false,$details=true,$imageSize='AllImages',$currentPage=1,$pageSize=10,$minPrice='0',$maxPrice='0',$sortBy='Rank',$sortOrder='Descending')
	{
		$params = array(
		'ShopId' => $shopId,
		'CategoryIds' => $categoryId,
		'IncludeChildNodes' => $includeChildNodes,
		'UseAffilinetCategories' => $useAffilinetCategories,
		'Query' => $query,
		'WithImageOnly' => $withImageOnly,
		'Details' => $details,
		'ImageSize' => $imageSize,
		'CurrentPage' => $currentPage,
		'PageSize' => $pageSize,
		'MinimumPrice' => $minPrice,
		'MaximumPrice' => $maxPrice,
		'SortBy' => $sortBy,
		'SortOrder' => $sortOrder
		);


		$this->soap_request = new SoapClient(WSDL_PS_WS);
		$req = $this->soap_request->SearchProductsInCategory(array(
		'CredentialToken' => parent::getToken(),
		'SearchProductsInCategoryRequestMessage' => $params
		));
		return $req;
	}
}
?>
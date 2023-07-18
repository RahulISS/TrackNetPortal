<?php
ini_set('display_errors', '1');
$data = file_get_contents("php://input");
$objData = json_decode($data);

//$url = "https://bluesiren.com.au/parser/login?email=raushan%40infinitysoftsystems.com&password=Raushan%401singh";
$url = "https://bluesiren.com.au/parser/login?email=piyush@yopmail.com&password=P@ssw0rd";
$headers = array(
	"Content-Type: application/json",
	"Accept: application/json",
);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); 
curl_setopt($ch, CURLOPT_HTTPHEADER,$headers);
$response = curl_exec($ch);
?>




<?php
ini_set('display_errors', '0');
$data = file_get_contents("php://input");
$objData = json_decode($data);
$paramQuery = $objData->query;
$token = $objData->token;
$url = "http://localhost:8080/api/lair/eval?expr=" . urlencode($paramQuery);
$headers = array(
	"Content-Type: application/json",
	"Accept: application/json",
	"Authorization: BEARER authToken=" . $token
);
$array = array( 
			'_kind' => "grid",
			'meta' => array( "ver" => "3.0" ), 
			'cols' =>  array( array( "name" => "expr" ) ), 
			'rows' => array( array( "expr" => $paramQuery ) )
);
$json_body = json_encode($array);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS,$json_body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); 
curl_setopt($ch, CURLOPT_HTTPHEADER,$headers);
$response = curl_exec($ch);
?> 
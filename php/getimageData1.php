<?php
include_once('curl.php');
ini_set('display_errors', '1');

$data = file_get_contents("php://input");
$objData = json_decode($data);

$xAccessToken = $_POST['token'];

$datetext_check = strpos($_POST['seldate'], ' - ');
$datetext = explode(' - ',$_POST['seldate']);

$beforday = date('Y-m-d', strtotime('-1 day', strtotime($datetext[0])));
$startTime2 = date('Y-m-d H:i:s',strtotime($datetext[0]));
$endTime2 = date('Y-m-d H:i:s',strtotime($datetext[1]));

$serial_number = $_POST['serial_number'];

//Pressure query
$data_url = "https://bluesiren.com.au/parser/getimagerecords?serialNumber=".rawurlencode($serial_number)."&startTime=".rawurlencode($startTime2)."&endTime=".rawurlencode($endTime2);
$curl_headers = array('header'=>"Accept: application/json\r\n" .
"Content-type: application/json\r\n" .
"X-Access-Token: " . $xAccessToken . "\r\n");

$data = curl($data_url,'GET', $data=null, $curl_headers, []);
$decoded = json_decode($data['content']);
echo json_encode($decoded);
?>




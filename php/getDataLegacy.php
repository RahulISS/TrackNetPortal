<?php
ini_set('display_errors', '0');

$data = file_get_contents("php://input");
$objData = json_decode($data);

$paramQuery = $objData->query;
$authToken = $objData->token;

//Prepare post
$data_opts = array(
  'http'=>array(
    'method'=>"GET",
    'header'=>"Accept: application/json\r\n" .
              "Content-type: application/json\r\n".
              "Cookie: " . $authToken . "\r\n"
  )
);

//Create context
$data_context = stream_context_create($data_opts);
$data_url = "http://server2.ozgreenenergy.com.au/api/gccc_wq/eval?expr=" . urlencode($paramQuery);
// $data_url = "http://staging-skyspark.tracwater.net.au/api/gccc_wq/eval?expr=" . urlencode($paramQuery);

$data = file_get_contents($data_url, false, $data_context);
$decoded = json_decode($data);
echo json_encode($decoded);
?>

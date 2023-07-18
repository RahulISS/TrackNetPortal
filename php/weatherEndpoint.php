<?php
// Initiate curl session in a variable (resource)
$curl_handle = curl_init();

$now = date('Y-m-d');

$url = "https://api.willyweather.com.au/v2/MzkzMDZkNjcxNDdjNDdkODE0MzA3Zm/locations/33069/weather.json?observational=true&days=1&startDate=".$now;

// Set the curl URL option
curl_setopt($curl_handle, CURLOPT_URL, $url);

// This option will return data as a string instead of direct output
curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);

// Execute curl & store data in a variable
$curl_data = curl_exec($curl_handle);

curl_close($curl_handle);

// Decode JSON into PHP array
$response_data = json_decode($curl_data);

echo json_encode($response_data);

?>
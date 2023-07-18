<?php

$data = file_get_contents("php://input");
$objData = json_decode($data);
$username = $objData->username;
$password = $objData->password;

$server_url = 'http://localhost:8080';

$hello_header =array(
    "Authorization: ". "HELLO username=".rtrim(strtr(base64_encode($username), '+/', '-_'), '='),
    "WWW-Authenticate: SCRAM"
);
$handshake_token = sendRequest($server_url,$hello_header,0);
$handshake_token = parse_string($handshake_token, '=', ',');
$random = md5(uniqid(mt_rand(), true));
$client_nonce = $random;
$client_first_msg = "n=".$username.",r=".$client_nonce;
$first_header = array(
    "Authorization: ". "SCRAM handshakeToken=".$handshake_token.", data=".rtrim(strtr(base64_encode($client_first_msg ), '+/', '-_'), '='),
    "WWW-Authenticate: SCRAM"
);
$server_first_res = sendRequest($server_url,$first_header,1);
$server_nonce = parse_string($server_first_res, 'r=', ',');
$server_salt  = parse_string($server_first_res, 's=', ',');
$iterations = substr($server_first_res, strpos($server_first_res, "i=") + 2);

$salted_password = hash_pbkdf2("sha256",$password, base64_decode($server_salt), intval($iterations),32, true);

$client_no_proof = 'c=biws,r='.$server_nonce;
$auth_message = $client_first_msg.','.$server_first_res.','.$client_no_proof;

$client_key = hash_hmac('sha256',"Client Key", $salted_password, true);

$stored_key = hash('sha256', $client_key, true);
$client_sig = hash_hmac('sha256', $auth_message, $stored_key, true);
$client_proof = ($client_key ^ $client_sig);
$client_final_msg   = $client_no_proof.",p=".base64_encode($client_proof);

$last_header = array(
    "Authorization: " . "SCRAM handshakeToken=".$handshake_token.", data=".rtrim(strtr(base64_encode($client_final_msg), '+/', '-_'), '=')
);
$server_final_res = sendRequest($server_url,$last_header,2);
echo($server_final_res);

function sendRequest($url,$header,$decode){
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_HEADER  , true);
	curl_setopt($ch, CURLOPT_HTTPHEADER,$header);
	$serverMsg = curl_exec($ch);
	if($decode == 0){
	}else if($decode == 1){
		$serverMsg = base64_decode(parse_string($serverMsg,"data=",","));
	}else if($decode == 2){
		$serverMsg = parse_string($serverMsg,"authToken=",",");
	}
	curl_close($ch);
	return $serverMsg;
}

function parse_string($string, $start, $end) {
	$string = ' ' . $string;
	$ini = strpos($string, $start);
	if ($ini == 0) return '';
	$ini += strlen($start);
	$len = strpos($string, $end, $ini) - $ini;
	return substr($string, $ini, $len);
}

?>
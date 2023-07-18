<?php
$apiUrl = 'http://127.0.0.1:8000/api/v1/login';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if the 'username' key exists in $_POST array
    if (isset($_POST['username'])) {
        $username = $_POST['username'];
    } else {
        echo "Username is missing.";
        exit;
    }

    // Check if the 'password' key exists in $_POST array
    if (isset($_POST['password'])) {
        $password = $_POST['password'];
    } else {
        echo "Password is missing.";
        exit;
    }

    // Create an array with the user input
    $data = array(
        'username' => $username,
        'password' => $password
    );

    // Encode the data as JSON
    $jsonData = json_encode($data);

    // Initialize cURL
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: ' . strlen($jsonData)
    ));

    // Execute the cURL request
    $response = curl_exec($ch);
    curl_close($ch);

    // Output the response
    echo $response;
}
?>

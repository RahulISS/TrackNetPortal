<?php

ini_set('display_errors', '0');

$data = file_get_contents("php://input");
$objData = json_decode($data);

$name = $objData->filename;
$contents = $objData->contents;

//write the contents to a file
//$filename = sys_get_temp_dir() . DIRECTORY_SEPARATOR .$name.".csv";
$filename = sys_get_temp_dir() . DIRECTORY_SEPARATOR .$name;

$csvfile = fopen($filename, "w") or die("Unable to open and write ".$filename. " file!");
fwrite($csvfile, $contents);
fclose($csvfile);

if (file_exists($filename)) {
    header('Content-Description: File Transfer');
   // header('Content-Type: application/octet-stream');
    header('Content-Type: text/plain');
    header('Content-Disposition: attachment; filename='.basename($filename));
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filename));
    readfile($filename);
    exit;
}
?>
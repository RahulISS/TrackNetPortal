<?php
include_once('curl.php');
ini_set('display_errors', '1');

$data = file_get_contents("php://input");
$objData = json_decode($data);

$currentTimeFold = time();

$imageFrames = $_POST['imageFrames'];
$isZipDownload = $_POST['isZipDownload'];
$isVideoDownload = $_POST['isVideoDownload'];

// $imageFrames = explode(",", $_GET['imageFrames']);
// $isZipDownload = $_GET['isZipDownload'];
// $isVideoDownload = $_GET['isVideoDownload'];

if (!file_exists('imageVideo')) {
  mkdir('imageVideo', 0777, true);
}

$currentImageVideoFolder = 'imageVideo/' . $currentTimeFold;

if (!file_exists($currentImageVideoFolder)) {
  mkdir($currentImageVideoFolder, 0777, true);
}

foreach ($imageFrames as $key => $imageFrm) {
  file_put_contents($currentImageVideoFolder . '/' . $key . '.jpg', file_get_contents($imageFrm));
}

if ($isVideoDownload === 'true') {
  $imageExecution = $currentImageVideoFolder . '/*.jpg';
  $imageVideoName = $currentImageVideoFolder . '.mp4';

  // $imageExecution = 'imageVideo/1650098256/*.jpg';
  // $imageVideoName = 'imageVideo/1650098256.mp4';

  $ert = shell_exec("ffmpeg  -framerate 1 -pattern_type glob -i '$imageExecution' -c:v libx264 -r 30 -pix_fmt yuv420p $imageVideoName 2>&1");
  //   echo "<pre>"; print_r($ert);
  // die;

  // header("Cache-Control: public");
  // header("Content-Description: File Transfer");
  // header("Content-Disposition: attachment; filename=" . $imageVideoName . "");
  // header("Content-Transfer-Encoding: binary");
  // header("Content-Type: binary/octet-stream");
  // readfile($imageVideoName);
   echo json_encode(array('fileName' => $_SERVER['HTTP_REFERER'].'php/' . $currentImageVideoFolder . '.mp4'));
}

if ($isZipDownload === 'true') {
  $rootPath = realpath($currentImageVideoFolder);

  // Initialize archive object
  $zip = new ZipArchive();
  $zip->open($currentImageVideoFolder . '.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE);

  // Create recursive directory iterator
  /** @var SplFileInfo[] $files */
  $files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($rootPath),
    RecursiveIteratorIterator::LEAVES_ONLY
  );

  foreach ($files as $name => $file) {
    // Skip directories (they would be added automatically)
    if (!$file->isDir()) {
      // Get real and relative path for current file
      $filePath = $file->getRealPath();
      $relativePath = substr($filePath, strlen($rootPath) + 1);

      // Add current file to archive
      $zip->addFile($filePath, $relativePath);
    }
  }

  // Zip archive will be created only after closing object
  $zip->close();
  // header("Cache-Control: public");
  // header("Content-Description: File Transfer");
  // header("Content-Disposition: attachment; filename=" . $currentImageVideoFolder . '.zip' . "");
  // header("Content-Transfer-Encoding: binary");
  // header("Content-Type: binary/octet-stream");
  // readfile($currentImageVideoFolder . '.zip');
  echo json_encode(array('fileName' => $_SERVER['HTTP_REFERER'].'php/' . $currentImageVideoFolder . '.zip'));
}

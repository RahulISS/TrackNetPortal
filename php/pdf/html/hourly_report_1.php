<?php $countSensorText = count($this->request->options->sensorText);?>
<?php $caseType = $this->request->options->caseType;?>
<?php 
	$dateLists = array_chunk($this->request->options->dateList,$this->weekLimit);
	$totalWeeks = count($this->fileData); 
?>
<?php if($caseType>0):?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Hourly Report 1</title>
	<style type="text/css">
		body{padding-top: .4in;}
		#footer {position: fixed;right: 0;left: 0;bottom: 0;width: 100%;}
		#footer .left, #footer .right{display: inline-block;width: 50%;}
		#footer .right{text-align: right;}
		#footer .right:after {content: counter(page);}
	</style>
</head>
<body>
<?php endif;?>
<style type="text/css">
    .body-div { font-family: Arial, sans-serif;width: 100%; }
    .body-div table { border-collapse: collapse; }
    .body-div tbody th[align="left"] { text-align: left; }
    .body-div tr { height: 18px; }
    .body-div tr.borbot td, .body-div th.borbot, .body-div td.borbot { border-bottom: 1px solid black; }
    .body-div td { font-size: 13px; }
    .body-div tbody th { padding-top: 5px; }
    .body-div .page-break { page-break-after: always; }
    .body-div th, .body-div td{ width: 12.5%; }
    .body-div td.empty { min-width: 12.5%; height: 10px; }
    .body-div .logo { margin-bottom: 30px; }
    .body-div h2 { white-space: nowrap; text-align: center; }
</style>
<div class="body-div">
<?php if($caseType==0):?><h2><?= $this->request->options->deviceText;?></h2><?php endif;?>
<?php foreach($this->fileData as $weekIndex => $fileData):?>
	<?php 
		$dateList = $dateLists[$weekIndex];
		$colSpnCnt = count($dateList) * $countSensorText;
		$needToadd = $this->weekLimit - count($dateList);
		// var_dump($needToadd);
	?>
	<?php if($caseType>0):?>
		<div id="footer"><span class="left">www.tracwater.com.au</span><span class="right">Page </span></div>
		<table class="logo" width="100%">
			<tr>
				<?php $image = file_get_contents(__DIR__."/img/cityofgoldcoast.jpg");?>
				<td align="left"><img src="data:image/jpg;base64,<?= base64_encode($image);?>" width="125px"/></td>
				<td align="center" width="60%"><h2><?= $this->request->options->deviceText;?></h2></td>
				<?php $image = file_get_contents(__DIR__."/img/tracwater-header.png");?>
				<td align="right"><img src="data:image/png;base64,<?= base64_encode($image);?>" width="125px"/></td>
			</tr>
		</table>
	<?php endif;?>
	<table width="100%">
		<thead>
			<tr>
				<th class="borbot" rowspan="3">&nbsp;</th>
				<?php foreach ($dateList as $key => $date):?>
					<td align="center"><?= date('l', strtotime($date));?></td>
				<?php endforeach;?>
				<?php if($needToadd>0) echo str_repeat("<td class='empty'>&nbsp;</td>", $needToadd);?>
			</tr>
			<tr>
				<?php foreach ($dateList as $key => $date):?>
					<td align="center"><?= date('M jS Y', strtotime($date));?></td>
				<?php endforeach;?>
				<?php if($needToadd>0) echo str_repeat("<td class='empty'>&nbsp;</td>", $needToadd);?>
			</tr>
			<tr class="borbot">
				<?php foreach ($dateList as $key => $date):?>
					<?php foreach ($this->request->options->sensorText as $key => $sen):?>
						<td align="left"><?= $sen;?></td>
					<?php endforeach;?>
				<?php endforeach;?>
				<?php if($needToadd>0) echo str_repeat("<td class='empty'>&nbsp;</td>", $needToadd);?>
			</tr>
		</thead>
		<tbody>
			<?php foreach(array_keys($fileData) as $index => $classes):?>
				<?php if(isset($fileData[$classes]) && count($fileData[$classes])>0):?>
					<tr<?= (($index+1)%4==0 ? ' class="borbot"' : '');?>>
						<td align="left"><?= $classes;?></td>
						<?php foreach ($dateList as $key => $date):?>
							<?php foreach ($this->request->options->sensorText as $sen => $lab):?>
								<?php if(isset($fileData[$classes][$date][$sen])):?>
									<td align="left">
									<?php 
										$avgVal = array_sum($fileData[$classes][$date][$sen])/count($fileData[$classes][$date][$sen]);
										echo round($avgVal,2);
									?>
									</td>
								<?php endif;?>
							<?php endforeach;?>
						<?php endforeach;?>
						<?php if($needToadd>0) echo str_repeat("<td class='empty'>&nbsp;</td>", $needToadd);?>
					</tr>
				<?php endif;?>
			<?php endforeach;?>
		</tbody>
	</table>
	<?php if($weekIndex != ($totalWeeks-1)):?>
		<div class="page-break"></div>
	<?php endif;?>
<?php endforeach;?>
<?php if($caseType>0 && isset($this->request->options->comment) && !empty($this->request->options->comment)):?>
	<?php foreach (str_split($this->request->options->comment,3755) as $comdex => $comment): ?>
		<div class="page-break"></div>
		<?php if($caseType>0):?>
			<div id="footer"><span class="left">www.tracwater.com.au</span><span class="right">Page </span></div>
			<table class="logo" width="100%">
				<tr>
					<?php $image = file_get_contents(__DIR__."/img/cityofgoldcoast.jpg");?>
					<td align="left"><img src="data:image/jpg;base64,<?= base64_encode($image);?>" width="125px"/></td>
					<td align="center" width="60%"><h2><?= $this->request->options->deviceText;?></h2></td>
					<?php $image = file_get_contents(__DIR__."/img/tracwater-header.png");?>
					<td align="right"><img src="data:image/png;base64,<?= base64_encode($image);?>" width="125px"/></td>
				</tr>
			</table>
		<?php endif;?>
		<?php if($comdex == 0):?><strong>Comment / Annotation ::</strong>&nbsp;<?php endif;?>
		<span><?= $comment ?></span>
	<?php endforeach;?>
<?php endif;?>
</div>
<?php if($caseType>0):?>
	</body>
	</html>
<?php endif;?>
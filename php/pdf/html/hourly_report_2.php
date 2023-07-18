<?php $countSensorText = count($this->request->options->sensorText);?>
<?php $caseType = $this->request->options->caseType;?>
<?php 
	$totalWeeks = count($this->fileData);
	$totalHours = range(0,23);
	$totalHours = array_map(function($h) {
		return str_pad($h,2,"0",STR_PAD_LEFT).":00";
	}, $totalHours);
?>
<?php if($caseType>0):?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Hourly Report 2</title>
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
    .body-div td { font-size: <?= ($caseType==0 ? '11' : '12');?>px; }
    .body-div tbody th { padding-top: 5px; }
    .body-div .page-break { page-break-after: always; }
    <?php if($caseType>0):?>
	    .body-div th, .body-div td{ width: 12.5%; }
	    .body-div td.empty { min-width: 12.5%; height: 10px; }
	<?php else: ?>
		.body-div td.empty { height: 10px; }
    <?php endif;?>
    .body-div .logo { margin-bottom: 30px; }
    .body-div h2 { white-space: nowrap; text-align: center; }
</style>
<div class="body-div">
<?php if($caseType==0):?><h2><?= $this->request->options->deviceText;?></h2><?php endif;?>
<?php foreach(array_keys($this->fileData) as $weekIndex => $date): $fileData = $this->fileData[$date];?>
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
				<td align="center" colspan="24"><?= date('l', strtotime($date));?></td>
			</tr>
			<tr>
				<td align="center" colspan="24"><?= date('M jS Y', strtotime($date));?></td>
			</tr>
			<tr class="borbot">
				<?php foreach ($totalHours as $hm):?>
					<td align="left"><?= $hm;?></td>
				<?php endforeach;?>
			</tr>
		</thead>
		<tbody>
			<?php foreach(['AM','PM','Daily'] as $classes):?>
				<?php if(isset($fileData[$classes]) && count($fileData[$classes])>0):?>
					<tr>
						<th align="left" colspan="25"><?= $classes;?></th>
					</tr>
					<tr>
						<td align="left">Total:</td>
						<?php foreach ($totalHours as $hm):?>
							<?php foreach ($this->request->options->sensorText as $sen => $lab):?>
								<td align="left">
									<?php if(isset($fileData[$classes][$hm][$sen])):?>
										<?= round(array_sum($fileData[$classes][$hm][$sen]),2);?>
									<?php endif;?>
								</td>
							<?php endforeach;?>
						<?php endforeach;?>
					</tr>
					<tr>
						<td align="left">Max:</td>
						<?php foreach ($totalHours as $hm):?>
							<?php foreach ($this->request->options->sensorText as $sen => $lab):?>
								<td align="left">
									<?php if(isset($fileData[$classes][$hm][$sen])):?>
										<?= round(max($fileData[$classes][$hm][$sen]),2);?>
									<?php endif;?>
								</td>
							<?php endforeach;?>
						<?php endforeach;?>
					</tr>
					<tr>
						<td align="left">Min:</td>
						<?php foreach ($totalHours as $hm):?>
							<?php foreach ($this->request->options->sensorText as $sen => $lab):?>
								<td align="left">
									<?php if(isset($fileData[$classes][$hm][$sen])):?>
										<?= round(min($fileData[$classes][$hm][$sen]),2);?>
									<?php endif;?>
								</td>
							<?php endforeach;?>
						<?php endforeach;?>
					</tr>
					<tr class="borbot">
						<td>Avg:</td>
						<?php foreach ($totalHours as $hm):?>
							<?php foreach ($this->request->options->sensorText as $sen => $lab):?>
								<td align="left">
									<?php if(isset($fileData[$classes][$hm][$sen])):?>									
										<?php 
											$avgVal = array_sum($fileData[$classes][$hm][$sen])/count($fileData[$classes][$hm][$sen]);
											echo round($avgVal,2);
										?>
									<?php endif;?>
								</td>
							<?php endforeach;?>
						<?php endforeach;?>
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
	<?php if(strlen($this->request->options->comment)>240):?>
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
	<?php else:?>
		<br><br>
		<strong>Comment / Annotation ::</strong>&nbsp;<span><?= $this->request->options->comment;?></span>
	<?php endif;?>
<?php endif;?>
</div>
<?php if($caseType>0):?>
	</body>
	</html>
<?php endif;?>
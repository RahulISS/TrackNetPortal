<?php $caseType = $this->request->options->caseType;?>
<?php $totalMonths = count($this->fileData);?>
<?php if($caseType>0):?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Daily Summaries Report 1</title>
	<style type="text/css">
		body{padding-top: .4in;}
		#footer {position: fixed;right: 0;left: 0;bottom: 0;width: 100%;}
		#footer .left,#footer .right{display: inline-block;width: 50%;}
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
    .body-div td { font-size: 13px; padding: 0 2px; }
    .body-div tbody th { padding-top: 5px; }
    .body-div .page-break { page-break-after: always; }
    .body-div .logo { margin-bottom: 30px; }
    .body-div h2 { white-space: nowrap; text-align: center; }
</style>
<div class="body-div">
<?php if($caseType==0):?><h2><?= $this->request->options->deviceText;?></h2><?php endif;?>
<?php foreach($this->fileData as $monthIndex => $monthFileData):?>
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
		<tr class="borbot">
			<td>Date</td>
			<td>Max</td>
			<td>Min</td>
			<td>Avg</td>
			<td>Total</td>
			<td align="center">Week 1 Summary</td>
			<td>Max</td>
			<td>Min</td>
			<td>Avg</td>
			<td>Total</td>
		</tr>
		<?php foreach($monthFileData as $weekIndex => $fileData):?>
			<?php 
				$lastDate = array_keys($fileData);
				$lastDate = end($lastDate);
				$lastWeek = ($weekIndex == (count($monthFileData)-1));
			?>
			<?php foreach($fileData as $date => $tblData): $isLast = (!$lastWeek && ($lastDate == $date)); ?>
			<tr<?= ($isLast ? ' class="borbot"' : '');?>>
				<td><?= $date;?></td>
				<td><?= round(max($tblData['Daily']),2);?></td>
				<td><?= round(min($tblData['Daily']),2);?></td>
				<td><?= round(array_sum($tblData['Daily'])/count($tblData['Daily']), 2);?></td>
				<td><?= round(array_sum($tblData['Daily']),2);?></td>
				<?php if(isset($tblData['Weekly'])):?>
					<td></td>
					<td><?= round(max($tblData['Weekly']),2);?></td>
					<td><?= round(min($tblData['Weekly']),2);?></td>
					<td><?= round(array_sum($tblData['Weekly'])/count($tblData['Weekly']), 2);?></td>
					<td><?= round(array_sum($tblData['Weekly']),2);?></td>
				<?php elseif($isLast):?>
					<td align="center">Week <?= $weekIndex+2;?> Summary</td>
					<td>Max</td>
					<td>Min</td>
					<td>Avg</td>
					<td>Total</td>
				<?php else:?>
					<td colspan="5"></td>
				<?php endif;?>
			</tr>
			<?php endforeach;?>
		<?php endforeach;?>
	</table>
	<?php if($monthIndex != ($totalMonths-1)):?>
		<div class="page-break"></div>
	<?php endif;?>
<?php endforeach;?>
<?php if($caseType>0 && isset($this->request->options->comment) && !empty($this->request->options->comment)):?>
	<?php if(strlen($this->request->options->comment)>300 || $weekIndex>2):?>
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
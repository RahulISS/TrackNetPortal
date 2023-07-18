<?php 
set_time_limit(0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
use Dompdf\Dompdf;

require_once 'pdf/dompdf/autoload.inc.php';

class flowReport
{
    public $request;
    protected $data;
    protected $fileData;
    protected $weekLimit = 7;
    protected $subject = [
        1 => 'Summary Report',
        2 => 'Daily Summaries Report 1',
        3 => 'Daily Summaries Report 2',
        4 => 'Hourly Report 1',
        5 => 'Hourly Report 2'
    ];
    protected $fdate;
    protected $tdate;

    public function __construct($data)
    {
        $this->data = [];
        $this->request = json_decode($data);
        $this->getChartData();
    }

    protected function getApiData($paramQuery)
    {
        $authToken = $this->request->token;
        $data_opts = [
            'http'=> [
                'method' => "GET",
                'header' => implode(
                    "\r\n",
                    ["Accept: application/json","Content-type: application/json","Cookie: " . $authToken]
                )
            ]
        ];

        //Create context
        $data_context = stream_context_create($data_opts);
        $data_url = "http://server2.ozgreenenergy.com.au/api/gccc_wq/eval?expr=" . urlencode($paramQuery);
        $data = file_get_contents($data_url, false, $data_context);
        $data = json_decode($data, true);
        return ($data['rows']!=null) ? $data['rows'] : [];
    }

    protected function callApiQuery($fdate,$tdate,$fold,$timespan)
    {
        $findReplace = [
            "##FDATE##" => $fdate,
            "##TDATE##" => date('Y-m-d', strtotime($tdate .' +1 day')),
            "##FOLD##" => $fold,
            "##TIMEFRAME##" => $timespan
        ];
        $paramQuery = str_replace(array_keys($findReplace), array_values($findReplace), $this->request->query);
        return $this->getApiData($paramQuery);
    }

    protected function getDatesFromRange($start, $end, $format = 'Y-m-d')
    {
        $array = array();

        $interval = new DateInterval('P1D');

        $realEnd = new DateTime($end);
        $realEnd->add($interval);

        $period = new DatePeriod(new DateTime($start), $interval, $realEnd);

        foreach($period as $date) {                 
            $array[] = $date->format($format); 
        }

        return $array;
    }

    protected function getChartData()
    {
        $this->fdate = $this->request->options->dateList[0];
        $this->tdate = $this->request->options->dateList[1];
        $this->data = $this->callApiQuery($this->fdate,$this->tdate,'actual','1h');
        $this->request->options->dateList = $this->getDatesFromRange($this->fdate, $this->tdate);
        $this->request->options->deviceText .= ' (' . date('M jS Y', strtotime($this->fdate)) . ($this->fdate==$this->tdate?'':' - '.date('M jS Y', strtotime($this->tdate))).')';
        switch($this->request->options->type){
            case 2:
            case 3:
                $this->processDailyOne();
            break;

            case 4:
                $this->processHourlyOne();
            break;

            case 5:
                $this->processHourlyTwo();
            break;

            case 1:
            default:
                $this->processSummaryData();
            break;
        }
        return $this;
    }

    protected function processSummaryData()
    {
        $sensorText = $this->request->options->sensorText;
        $dateList = $this->request->options->dateList;
        foreach(array_chunk($dateList, $this->weekLimit) as $weekIndex => $weekDates) {
            $lastDate = end($weekDates);
            $lastDate = date('Y-m-d', strtotime($lastDate));
            foreach($this->data as $data) {
                $date = explode('+',$data['ts']);
                $date = str_replace('T',' ',$date[0]);
                $wholeDate = date('Y-m-d',strtotime($date));
                if(!in_array($wholeDate, $weekDates)) continue;

                $Ampm = date('A',strtotime($date));
                foreach($sensorText as $kin => $nm) {
                    if(isset($data['v'.$kin])){
                        $eachValue = $data['v'.$kin];
                        $this->fileData[$weekIndex][$Ampm][$wholeDate][$kin][] = $eachValue;
                        $this->fileData[$weekIndex]['Daily'][$wholeDate][$kin][] = $eachValue;
                        $this->fileData[$weekIndex]['Weekly'][$lastDate][$kin][] = $eachValue;
                    }
                }
            }
        }
    }

    protected function processDailyOne()
    {
        $sensorText = $this->request->options->sensorText;
        $dateList = $this->request->options->dateList;
        $monthWiseDates = [];
        foreach($dateList as $date) {
            $monthWiseDates[date('m', strtotime($date))][] = $date;
        }
        foreach(array_values($monthWiseDates) as $monthIndex => $monthDates) {
            foreach(array_chunk($monthDates, $this->weekLimit) as $weekIndex => $weekDates) {
                $lastDate = $weekDates[0];
                $lastDate = date('Y-m-d', strtotime($lastDate));
                foreach($this->data as $data) {
                    $date = explode('+',$data['ts']);
                    $date = str_replace('T',' ',$date[0]);
                    $wholeDate = date('Y-m-d',strtotime($date));
                    if(!in_array($wholeDate, $weekDates)) continue;

                    foreach($sensorText as $kin => $nm) {
                        if(isset($data['v'.$kin])){
                            $eachValue = $data['v'.$kin];
                            $this->fileData[$monthIndex][$weekIndex][$wholeDate]['Daily'][] = $eachValue;
                            $this->fileData[$monthIndex][$weekIndex][$lastDate]['Weekly'][] = $eachValue;
                        }
                    }
                }
            }
        }
    }

    protected function processHourlyOne()
    {
        $sensorText = $this->request->options->sensorText;
        $dateList = $this->request->options->dateList;
        foreach(array_chunk($dateList, $this->weekLimit) as $weekIndex => $weekDates) {
            foreach($this->data as $data) {
                $date = explode('+',$data['ts']);
                $date = str_replace('T',' ',$date[0]);
                $wholeDate = date('Y-m-d',strtotime($date));
                if(!in_array($wholeDate, $weekDates)) continue;

                $Ampm = date('H:00',strtotime($date));
                foreach($sensorText as $kin => $nm) {
                    if(isset($data['v'.$kin])){
                        $eachValue = $data['v'.$kin];
                        $this->fileData[$weekIndex][$Ampm][$wholeDate][$kin][] = $eachValue;
                    }
                }
            }
        }
    }

    protected function processHourlyTwo() {
        $sensorText = $this->request->options->sensorText;
        foreach($this->data as $data) {
            $date = explode('+',$data['ts']);
            $date = str_replace('T',' ',$date[0]);
            $wholeDate = date('Y-m-d',strtotime($date));
            $eachHour = date('H:00',strtotime($date));
            $Ampm = date('A',strtotime($date));
            foreach($sensorText as $kin => $nm) {
                if(isset($data['v'.$kin])){
                    $eachValue = $data['v'.$kin];
                    $this->fileData[$wholeDate][$Ampm][$eachHour][$kin][] = $eachValue;
                    $this->fileData[$wholeDate]['Daily'][$eachHour][$kin][] = $eachValue;
                }
            }
        }
    }

    public function getHtml()
    {
        ob_start();
        switch($this->request->options->type){
            case 1:
            default:
                include_once('pdf/html/summary_report.php');
            break;
            case 2:
                include_once('pdf/html/daily_summary_report1.php');
            break;
            case 3:
                include_once('pdf/html/daily_summary_report2.php');
            break;
            case 4:
                include_once('pdf/html/hourly_report_1.php');
            break;
            case 5:
                include_once('pdf/html/hourly_report_2.php');
            break;
        }
        $html = ob_get_contents();
        ob_end_clean();
        return $html;
    }

    public function generatePdf()
    {
        $html = $this->getHtml();
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();
        return $dompdf->output();
    }

    public function sendMail()
    {
        $html = $this->generatePdf();
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'ozgreen.iss992@gmail.com';
            $mail->Password   = 'mdttlavonbzwpfwf';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = 465;

            $mail->setFrom('ozgreen.iss992@gmail.com', 'oZgreen');
            $mail->addAddress('akash@infinitysoftsystems.com', 'Test User');
            $mail->addBCC('mritunjay@infinitysoftsystems.com');

            $mail->addStringAttachment($html, $this->subject[$this->request->options->type].'.pdf');

            $mail->Subject = $this->subject[$this->request->options->type];
            $mail->Body    = $this->subject[$this->request->options->type];

            $mail->send();
            $return = 'Mail has been sent';
        } catch (\Exception $e) {
            $return = "Mail could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
        return $return;
    }

    public function executeCase()
    {
        $data = '';
        switch($this->request->options->caseType) {
            case 1:
                header('Content-type: application/pdf');
                $data = $this->generatePdf();
            break;

            case 2:
                $data = $this->sendMail();
            break;

            default:
                $data = $this->getHtml();
            break;
        }
        return $data;
    }
}
$flowReport = new flowReport(file_get_contents("php://input"));
echo $flowReport->executeCase();
die;
?>

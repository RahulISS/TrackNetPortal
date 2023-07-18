
   

$('.SeeMore2').on('click',function () {
    $('.block-1').toggleClass('flwd');

  });

$('.SeeMore3').on('click',function () {
$('.block-3').toggleClass('flwd');
});

$('.SeeMore4').on('click',function () {
$('.block-2').toggleClass('flwd');
});

$('.SeeMore2').click(function(){
    var $this = $(this);
    $this.toggleClass('SeeMore2');
    if($this.hasClass('SeeMore2')){
      $this.text('Expand');     
    } else {
      $this.text('Collapse');
    }
  });
 
      $('.SeeMore3').click(function(){
    var $this = $(this);
    $this.toggleClass('SeeMore3');
    if($this.hasClass('SeeMore3')){
      $this.text('Expand');     
    } else {
      $this.text('Collapse');
    }
  });
 
      $('.SeeMore4').click(function(){
    var $this = $(this);
    $this.toggleClass('SeeMore4');
    if($this.hasClass('SeeMore4')){
      $this.text('Expand');     
    } else {
      $this.text('Collapse');
    }
  });

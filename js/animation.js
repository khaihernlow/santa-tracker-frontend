var $card = $('.photos__card');
var lastCard = $(".photos__list .photos__card").length - 1;

$('.photos__list').click(function(){ 
	var prependList = function() {
		if( $('.photos__card').hasClass('activeNow') ) {
			var $slicedCard = $('.photos__card').slice(lastCard).removeClass('transformThis activeNow');
			$('ul').prepend($slicedCard);
		}
	}
	$('li').last().removeClass('transformPrev').addClass('transformThis').prev().addClass('activeNow');
	setTimeout(function(){prependList(); }, 150);
});
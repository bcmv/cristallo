$(function(){
	$('#carousel').on('slide.bs.carousel', function (e) {
		var self = $(e.target).find('.carousel-mover');
		$('.carousel-mover').removeClass("active");
		console.log(self);
		self.addClass("active");
	});
	$("body").on("click", '.carousel-mover', function(){
		var self = $(this);
		var index = self.attr("data-index");
		$("#carousel").carousel(parseInt(index));
		$('.carousel-mover').removeClass("active");
		console.log(self);
		self.addClass("active");
	});
});


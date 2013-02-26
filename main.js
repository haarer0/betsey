$(document).ready(function() {

	$('#canvas').betsey({
		movieName: 'toyota', 
		events : {
			onMovieLoaded : function(oProps) {
				console.log('movie is loaded!');
			}
		}
	});



	$('#change_to_metallic').click(function(e) {
		e.preventDefault();
		$('#canvas').betsey('changePart', 'front_logo', 'metallic');
	});

	$('#change_to_blue').click(function(e) {
		e.preventDefault();
		$('#canvas').betsey('changePart', 'front_logo', 'blue');
	});

/*
	$('#canvas').click(function(e) {
		e.preventDefault();
		var pos = e.pageX - $(this).offset().left;
		$('#canvas').betsey((pos < $(this).width() / 2) ? 'drawPrevFrame' : 'drawNextFrame');
	});
*/

	var bIsClicked = false;
	$('#canvas').mousedown(function(e) {
		bIsClicked = true;
		return false;
	});

	$('#canvas').mouseup(function(e) {
		bIsClicked = false;
		return false;
	});

	var nState = 0;
	var nPrevX = null;
	$('#canvas').mousemove(function(e) {
		e.preventDefault();

		if (!bIsClicked) {	
			nState = 0;
			return false;
		}

		var pos = e.pageX - $(this).offset().left;
		
		if (nState === 0) {
			nState = 1;
			nPrevX = pos;

			setTimeout(function() {
				nState = 2;
			}, 200);
		} 

		if ((nState === 2) && (Math.abs(nPrevX - pos) > 50)) {
			$('#canvas').betsey((nPrevX - pos < 0) ? 'drawPrevFrame' : 'drawNextFrame');
			nState = 0;			
		}

		return false;
	});
});
$(document).ready(function() {

	var sMovieToLoad = 'toyota';
	$('#canvas').betsey({
		movieName: sMovieToLoad		
	});



	var nTotalFrames = 0;
	var nLoadedFrames = 0;
	var nStartTime = new Date().getTime();
	function GetElapsedTime() {
		var s = new Date(new Date().getTime() - nStartTime).getTime();
		return  s / 1000;
	}

	var hLogBox = $('#logbox');
	function LogMessage(sMessage) {
		hLogBox.prepend('<p><span class="log-time">' + GetElapsedTime() + 's</span>' + sMessage + '</p>');
	}

	LogMessage('Loading movie "' + sMovieToLoad + '"');
	$('#canvas').betsey('addEventListener', 'onMovieLoaded', function(oProps) {
		nTotalFrames = oProps['totalFrames'];

		LogMessage('Movie is loaded! Loading initial frame(' + oProps['startFromFrame'] + ')');
	});
	$('#canvas').betsey('addEventListener', 'onInitialFrameLoaded', function(nFrame) {
		nLoadedFrames++;
		LogMessage('Initial frame(' + nFrame + ') is loaded! (BG) Loading the rest frames');
	});

	$('#canvas').betsey('addEventListener', 'onOtherFrameLoaded', function(nFrame) {
		nLoadedFrames++;
		LogMessage('Loaded frame(' + nFrame + '), ' + nLoadedFrames + '/' + nTotalFrames + ' ' + (Math.round(nLoadedFrames / nTotalFrames * 100)) + '%');
	});







	$('#change_to_metallic').click(function(e) {
		e.preventDefault();
		$('#canvas').betsey('changePart', 'front_logo', 'metallic');
	});

	$('#change_to_blue').click(function(e) {
		e.preventDefault();
		$('#canvas').betsey('changePart', 'front_logo', 'blue');
	});

	var hHammer = $('#canvas').hammer({
		drag_min_distance: 5,
		stop_browser_behavior : true		
	});

	var nLastDragTime = 0;
	var nLastX = -1;

	$(document).bind('touchmove', function(e) {
		e.preventDefault();
	});

	hHammer.on('dragstart', function(e) {
		nLastDragTime = e.gesture.timestamp;
		nLastX = e.gesture.center.pageX - e.target.offsetLeft;
	});
	hHammer.on('dragend', function(e) {
		nLastDragTime = 0;
		nLastX = -1;
	});

	hHammer.on('drag', function(e) {
		if (e.gesture.timestamp - nLastDragTime < 30) {
			return;
		}

		var nPos = e.gesture.center.pageX - e.target.offsetLeft;
		var nDeltaX = nPos - nLastX;

		if (Math.abs(nDeltaX) < 10) {
			return;
		}

		nLastDragTime = e.gesture.timestamp;
		nLastX = nPos;	
		$('#canvas').betsey(nDeltaX > 0 ? 'drawPrevFrame' : 'drawNextFrame');
	})

/*
	$('#canvas').click(function(e) {
		e.preventDefault();
		var pos = e.pageX - $(this).offset().left;
		$('#canvas').betsey((pos < $(this).width() / 2) ? 'drawPrevFrame' : 'drawNextFrame');
	});
*/
/*
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
	var nPrevY = null;


	$('#canvas').mouseout(function(e) {
		nState = 0;		
	});

	$('#canvas').mousemove(function(e) {
		e.preventDefault();

		if (!bIsClicked) {	
			nState = 0;
			return false;
		}

		var posX = e.pageX - $(this).offset().left;
		var posY = e.pageY - $(this).offset().top;
		
		if (nState === 0) {
			nState = 1;
			nPrevX = posX;
			nPrevY = posY;

			setTimeout(function() {
				nState = 2;
			}, 5);
		} 

		if ((nState === 2)) {
			if (Math.abs(nPrevX - posX) > 5) {
				$('#canvas').betsey((nPrevX - posX < 0) ? 'drawPrevFrame' : 'drawNextFrame');
			}

			if (Math.abs(nPrevY - posY) > 5) {
				$('#canvas').betsey('addScale', (nPrevY - posY > 0) ? 0.1 : -0.1);
			}

			nState = 0;			
		}

		return false;
	});
*/
});
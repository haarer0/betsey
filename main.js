$(document).ready(function() {

	var sMovieToLoad = 'toyota';
	var oMovieProps = {};
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

	LogMessage('starting v 0.1.1');
	LogMessage('Loading movie "' + sMovieToLoad + '"');
	$('#canvas').betsey('addEventListener', 'onMovieLoaded', function(oProps) {
		nTotalFrames = oProps['totalFrames'];
		oMovieProps = oProps;
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
		nLoadedFrames = 0;
		$('#canvas').betsey('changePart', 'front_logo', 'metallic');
	});

	$('#change_to_blue').click(function(e) {
		e.preventDefault();
		nLoadedFrames = 0;
		$('#canvas').betsey('changePart', 'front_logo', 'blue');
	});

	var hHammer = $('#canvas').hammer({
		drag_min_distance: 5,
		stop_browser_behavior : true,

		transform_min_scale : 0.1,
		transform_max_scale : 2
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




	var nSwipeTimer = null;
	var nSwipeCounter = 0;
	var bIsSwipeToRight = false;
	hHammer.on('tap', function() {
		StopSwiping();
	});

	hHammer.on('dragstart', function(e) {
		StopSwiping();
	});

	hHammer.on('swipe', function(e) {
		StopSwiping();

		nSwipeCounter = Math.abs(e.gesture.velocityX * 20);
		bIsSwipeToRight = e.gesture.deltaX > 0;

		LogMessage('Swiping ' + (bIsSwipeToRight ? 'right' : 'left') + ', c: ' + nSwipeCounter);

		DoSwipe();
	});

	function StopSwiping() {
		if (nSwipeTimer) {
			clearTimeout(nSwipeTimer);
		}
	}

	function DoSwipe() {
		nSwipeCounter -= 0.2;
		if (nSwipeCounter < 5) {
			nSwipeCounter = 5;
		}
		if (nSwipeCounter > 95) {
			nSwipeCounter = 95;
		}

		$('#canvas').betsey(bIsSwipeToRight ? 'drawPrevFrame' : 'drawNextFrame');
		nSwipeTimer = setTimeout(DoSwipe, Math.round(100 - nSwipeCounter));
	}




	var nZoomTimer = null;
	$('.zoom').mousedown(function(e) {
		$(this).addClass('clicked');
		e.preventDefault();
	}).mouseup(function(e) {
		$(this).removeClass('clicked');
		e.preventDefault();
		ClearZoomTimer();
	}).mouseout(function(e) {
		$(this).removeClass('clicked');
		e.preventDefault();
		ClearZoomTimer();
	});


	$('#zoom-in').mousedown(function(e){
		e.preventDefault();

		if (nZoomTimer) {
			return;
		}
		OnZoomButtonHold(0.1);
	});

	$('#zoom-out').mousedown(function(e){
		e.preventDefault();
		
		if (nZoomTimer) {
			return;
		}
		OnZoomButtonHold(-0.1);
	});

	function OnZoomButtonHold(nZoomValue) {
		$('#canvas').betsey('addScale', nZoomValue);

		nZoomTimer = setTimeout(function() {
			OnZoomButtonHold(nZoomValue);
		}, 50);
	}

	function ClearZoomTimer() {
		if (!nZoomTimer) {
			return;
		}
		clearTimeout(nZoomTimer);
		nZoomTimer = null;		
	}

	Hammer.plugins.showTouches();
	Hammer.plugins.fakeMultitouch();
	var nCurrentScale = 1;
	var oldScale = null;
	hHammer.on('transform', function(ev){
		LogMessage('scaling...')
		console.log('scaling')
		var scale = Math.round((ev.gesture.scale / 2) * 100) / 100;
		if (scale < 0.1) {
			scale = 0.1;
		}

		if (scale > 2) {
			scale = 2;
		}

		if (oldScale === null) {
			oldScale = scale;
			return;
		}

		if (Math.abs(oldScale - scale) < 0.1) {
			return;
		}

		LogMessage('adding scale ' + (scale - oldScale))
		$('#canvas').betsey('addScale', scale - oldScale);
		oldScale = scale;
		return;
	});

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
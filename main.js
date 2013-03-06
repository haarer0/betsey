$(document).ready(function() {

	var oMovieProps = {};
	var sCurrentMovie = $('#objMovie').val();

	$('#canvas').betsey({
		debug : true	
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

	LogMessage('starting v 0.1.2');


	$('#canvas').betsey('addEventListener', 'onMoviePropsLoaded', OnMoviePropsLoaded);
	$('#canvas').betsey('addEventListener', 'onFrameLoaded', OnLoadedFrame);
	$('#canvas').betsey('addEventListener', 'onAllFramesLoaded', OnAllFramesLoaded);


	$('#canvas').betsey('loadMovie', sCurrentMovie);
	OnBeginLoadingMovie(sCurrentMovie);

	$('#objMovie').change(function(e) {
		e.preventDefault();

		sCurrentMovie = $('#objMovie').val();
		$('#canvas').betsey('loadMovie', $(this).value());		
		OnBeginLoadingMovie(sCurrentMovie);
	});

	function OnBeginLoadingMovie(sMovieName) {
		StopAllAnimation();
		
		$('#loading-overlay').show();
		$('#loading-name').html(sMovieName);
		$('#loading-percents').html('0');
		$('#loading-curframes').html('0');
		$('#loading-totalframes').html(nTotalFrames);
	
		nLoadedFrames = 0;
		LogMessage('Loading movie "' + sMovieName + '"');
	}

	function OnChangedAttrs() {
		StopAllAnimation();

		$('#loading-overlay').show();
		$('#loading-name').html(sCurrentMovie);
		$('#loading-percents').html('0');
		$('#loading-curframes').html('0');
		$('#loading-totalframes').html(nTotalFrames);

		nLoadedFrames = 0;		
		LogMessage('Changed props, reloading movie');	
	}

	function OnMoviePropsLoaded(oProps) {
		nTotalFrames = oProps['totalFrames'];
		oMovieProps = oProps;
		$('#loading-totalframes').html(nTotalFrames);
		LogMessage('Movie props are loaded! Loading initial frame(' + oProps['startFromFrame'] + ')');

		$('#movieAttrs').html('');
		for (var p in oMovieProps.parts) {
			var nVariantCount = 0;
			for (var v in oMovieProps.parts[p].variants) {
				nVariantCount++;
			}
			if (nVariantCount < 2) {
				continue;
			}

			var sID = 'options-' + p; 
			$('#movieAttrs').append('<div class="options" id="' + sID + '"><span class="part-name">' + oMovieProps.parts[p].name + ':</span></div>');

			for (var v in oMovieProps.parts[p].variants) {
				$('#' + sID).append('<div class="attr-color" style="background-color: ' + oMovieProps.parts[p].variants[v]._color + ';" data-part="' + p + '" data-variant="' + v + '"></div>');				
			}
		}

		$('.attr-color').click(function(e) {
			e.preventDefault();
			var $self = $(this);
			OnChangedAttrs();
			$('#canvas').betsey('changePartVariant', $self.data('part'), $self.data('variant'));
		});
	}

	function OnLoadedFrame(nFrame) {
		nLoadedFrames++;	
		LogMessage('Loaded frame: ' + nFrame + '/' + nTotalFrames);		
		$('#loading-curframes').html(nLoadedFrames);
		$('#loading-percents').html(Math.round((nLoadedFrames / nTotalFrames) * 100));		
	}

	function OnAllFramesLoaded() {
		$('#loading-overlay').hide();	
		LogMessage('All frames are loaded!');

		var aParts = $('#canvas').betsey('getPartVariants');
		$('#movieAttrs .attr-color').removeClass('active');
		for (var i in aParts) {
			$('#options-'+i).find('div[data-variant=' + aParts[i] +']').addClass('active');
		}	
	}


	function StopAllAnimation(){
		StopSwiping();
		StopRotate();
	}



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
		DoRotate(nDeltaX < 0);
	});

	var nRotateTimer = 0;
	$('#rotate-left').mousedown(function(e){
		e.preventDefault();
		StopRotate();
		nRotateTimer = setInterval(function() {
			DoRotate(true);
		}, 30);		
	});

	$('#rotate-right').mousedown(function(e){
		e.preventDefault();
		StopRotate();
		nRotateTimer = setInterval(function() {
			DoRotate(false);
		}, 30);		
	});

	$('#rotate-left, #rotate-right').mouseup(function(e) {
		e.preventDefault();
		StopRotate();
	}).mouseout(function(e) {
		e.preventDefault();
		StopRotate();
	});

	function DoRotate(bIsRight) {
		$('#canvas').betsey(bIsRight ? 'drawNextFrame' : 'drawPrevFrame');
	}
	function StopRotate() {
		if (nRotateTimer) {
			clearInterval(nRotateTimer);
		}
	}



	var nSwipeTimer = null;
	var nSwipeCounter = 0;
	var bIsSwipeToRight = false;
	hHammer.on('tap', function() {
		StopSwiping();
	});

	hHammer.on('dragstart', function(e) {
		StopSwiping();
	});

/*
	hHammer.on('swipe', function(e) {
		StopSwiping();

		nSwipeCounter = Math.abs(e.gesture.velocityX * 20);
		bIsSwipeToRight = e.gesture.deltaX > 0;

		LogMessage('Swiping ' + (bIsSwipeToRight ? 'right' : 'left') + ', c: ' + nSwipeCounter);

		DoSwipe();
	});
	*/


	$('#swipe-left').click(function(e) {
		e.preventDefault();

		nSwipeCounter = 75;
		bIsSwipeToRight = false;
		LogMessage('Swiping left, c: ' + nSwipeCounter);
		StopSwiping();
		DoSwipe();
	});

	$('#swipe-right').click(function(e) {
		e.preventDefault();

		nSwipeCounter = 75;
		bIsSwipeToRight = true;
		LogMessage('Swiping right, c: ' + nSwipeCounter);
		StopSwiping();
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

	var nCurrentScale = 1;
	var oldScale = null;

	hHammer.on('transformstart', function(ev) {
		oldScale = null;
	});

	hHammer.on('transform', function(ev){
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

		$('#canvas').betsey('addScale', scale - oldScale);
		oldScale = scale;
		return;
	});
});
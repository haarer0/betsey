(function( $ ){
	var _$canvas = null,
		_hContext = null,
		_sCurrentMovie = '',
		_sCurrentPath = '',
		_oCurrentConfig = {},
		_bIsMovieLoading = false,
		_oMovieProperties = null,
		_nCurrentFrame = 0,
		_aImgs = {};

	var _settings = {
		moviesRootURL : '/content/',
		moviePropertiesFileName : 'properties.js',
		callbacks: {			
			onMoviePropertiesLoaded : function() {}
			onBeginLoadingFrames : function() {},
			onFrameLoaded : function(sPart, nTotalFramesLoaded) {},
			onAllFramesLoaded : function() {}
		}

	}

	var methods = {
		init : function( options ) { 
			options = options || {};			
			for (var i in options) {
				_settings[i] = options[i];
			}	

			_$canvas = this;
			if (!_$canvas.length) {
				$.error('Please provide valid selector of existed canvas');
			}

			_oMovieProperties = null;
			_sCurrentPath = '';

			//_hContext = this[0].getContext('2d');
			if (options['movieName'] !== undefined) {
				_LoadMovie(options['movieName']);
			}
		},

		loadMovie : function(sMovieName) {
			_LoadMovie(sMovieName);
		},

		changePart : function(sPartName, sVariant) {
			_ChangePart(sPartName, sVariant);
		},

		drawNextFrame : function() { 
			_nCurrentFrame++;
			_DrawFrame();
		},

		drawPrevFrame : function() { 
			_nCurrentFrame--;
			_DrawFrame();
		}
	};


	function _LoadMovie(sMovieName) {
		if (_bIsMovieLoading) {
			console.log('You must wait until previous movie loads completely');
			return;
		}

		_oMovieProperties = null;
		_bIsMovieLoading = true;
		_sCurrentMovie = sMovieName;
			
		_sCurrentPath = _settings['moviesRootURL'] + sMovieName;
		_aImgs = {};
		_$canvas.html('');

		$.getScript(_sCurrentPath + '/' + _settings['moviePropertiesFileName'])
			.done(_OnLoadedMovie)
			.fail(_OnLoadingMovieFailed);
	};

	function _OnLoadedMovie(sData, sTextStatus, jqxhr) {
		_bIsMovieLoading = false;
		_oMovieProperties = movieProperties;
		_oCurrentConfig = {};

		_$canvas.css('position', 'relative');

		for (var i in _oMovieProperties['parts']) {
			for (var ii in _oMovieProperties['parts'][i].variants) {
				_oCurrentConfig[i] = ii;
				break;				
			}
			
		} 

		_settings['onMoviePropertiesLoaded'](movieProperties);
		_DrawFrame(_oMovieProperties['startFromFrame']);
	}

	function _OnLoadingMovieFailed(jqxhr, settings, exception) {
		_bIsMovieLoading = false;
		$.error('Cannot load movie "' + _sCurrentMovie + '", reason: ' + exception);
	}



	function _LoadImageLayer(sPart, nFrameCalculated) {
		var sPath = _sCurrentPath + '/images/' + sPart + '/' + _oCurrentConfig[sPart] + '/' + nFrameCalculated + '.' + _oMovieProperties['fileExtensions'];		
		$('#_betsey-layer-' + sPart).attr('src', sPath);
	}

	function _LoadAllImageLayers(nFrameCalculated) {
		for (var i in _oCurrentConfig) {
			_LoadImageLayer(i, nFrameCalculated);
		}			
	}







	function _ChangePart(sPartName, sVariant) {
		_oCurrentConfig[sPartName] = sVariant;
		_LoadImageLayer(sPartName, _nCurrentFrame);
	}

	function _DrawFrame(nFrame) {
		if (!_oMovieProperties) {
			return;
		}

		if (nFrame === undefined) {
			nFrame = _nCurrentFrame;
		}

		if (nFrame < 0) {
			nFrame = Math.abs(_oMovieProperties['totalFrames'] + nFrame);
		}

		if (nFrame > (_oMovieProperties['totalFrames'] - 1)) {
			nFrame = nFrame % (_oMovieProperties['totalFrames']);
		}

		_nCurrentFrame = nFrame;
		_LoadAllImageLayers(nFrame);
	}


	$.fn.betsey = function( method ) {
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.betsey' );
		}
	};

})( jQuery );
(function( $ ){
	var _self = null,
		_$canvas = null,
		_nCanvasW = 0,
		_nCanvasH = 0,
		_hContext = null,
		_sCurrentMovie = '',
		_sCurrentPath = '',
		_oCurrentParts = {},
		_bIsMovieLoading = false,
		_oMovieProperties = null,
		_nCurrentFrame = 0,
		_aFrames = {},
		_aEvents = {};

	var _aRegisteredEventNames = {
		F_ON_MOVIE_LOADED : 'onMovieLoaded',
		F_ON_INITIAL_FRAME_LOADED : 'onInitialFrameLoaded',
		F_ON_OTHER_FRAME_LOADED : 'onOtherFrameLoaded'
	}

	var _settings = {
		moviesRootURL : window.location + 'content/',
		moviePropertiesFileName : 'properties.js'
	}

	var methods = {
		init : function( options ) {
			options = options || {};	
			
			_aEvents = {};
			for (var ev in _aRegisteredEventNames) {
				_aEvents[_aRegisteredEventNames[ev]] = function() {};
			}

			for (var i in options) {
				if (i !== 'events') {
					_settings[i] = options[i];
				} else {
					for (var ii in options[i]) {
						_aEvents[ii] = options[i][ii];
					}
				}
			}


			_$canvas = this;
			if (!_$canvas.length) {
				$.error('Please provide valid selector of existed canvas');
			}

			_nCanvasW = _$canvas.width();
			_nCanvasH = _$canvas.height();

			_oMovieProperties = null;
			_sCurrentPath = '';
			_aFrames = {};
			_hContext = this[0].getContext('2d');

			if (options['movieName'] !== undefined) {
				_LoadMovie(options['movieName']);
			}
		},

		addEventListener : function(sEventName, fCallback) {
			_aEvents[sEventName] = fCallback;
		},

		removeEventListener : function(sEventName) {
			_aEvents[sEventName] = function() {};
		},

		loadMovie : function(sMovieName) {
			_LoadMovie(sMovieName);
		},

		changePart : function(sPartName, sVariant) {
			_ChangePart(sPartName, sVariant);
		},

		drawNextFrame : function() {
			var nPrevFrame = _nCurrentFrame++;
			if (_nCurrentFrame >= _oMovieProperties['totalFrames']) {
				_nCurrentFrame = 0;
			}

			if (!_DrawFrame()) {
				_nCurrentFrame = nPrevFrame;	
			}
		},

		drawPrevFrame : function() { 			
			var nPrevFrame = _nCurrentFrame--;
			if (_nCurrentFrame < 0) {
				_nCurrentFrame = _oMovieProperties['totalFrames'] - 1;
			}

			if (!_DrawFrame()) {
				_nCurrentFrame = nPrevFrame;	
			}
		},

		__getImgs : function() {
			console.log(_aImgs);
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

		$.getScript(_sCurrentPath + '/' + _settings['moviePropertiesFileName'])
			.done(_OnLoadedMovie)
			.fail(_OnLoadingMovieFailed);
	};

	function _OnLoadedMovie(sData, sTextStatus, jqxhr) {
		_bIsMovieLoading = false;
		_oMovieProperties = movieProperties;
		_oCurrentParts = {};


		for (var i in _oMovieProperties['parts']) {
			for (var ii in _oMovieProperties['parts'][i].variants) {
				_oCurrentParts[i] = ii;
				break;				
			}
		} 

		_aEvents[_aRegisteredEventNames.F_ON_MOVIE_LOADED](movieProperties);

		_PreloadAndDraw(_oMovieProperties['startFromFrame']);
		_PreloadOtherFrames(_oMovieProperties['startFromFrame']);
	}

	function _OnLoadingMovieFailed(jqxhr, settings, exception) {
		_bIsMovieLoading = false;
		$.error('Cannot load movie "' + _sCurrentMovie + '", reason: ' + exception);
	}

	function _ChangePart(sPartName, sVariant) {
		_oCurrentParts[sPartName] = sVariant;
		_PreloadAndDraw(_nCurrentFrame);
		_PreloadOtherFrames(_nCurrentFrame);
	}

	function _GetImgFullPath(sPart, nFrame) {
		return _sCurrentPath + '/images/' + sPart + '/' + _oCurrentParts[sPart] + '/' + nFrame + '.' + _oMovieProperties['fileExtensions'];	
	}

	function _IsFrameExisted(nFrame) {
		var bIsAllPartsReady = true;
		if (_aImgs[nFrame] !== undefined) {
			for (var i in _oMovieProperties['parts']) {
				if (!bIsAllPartsReady || (_aImgs[nFrame][i] === undefined) || (_aImgs[nFrame][i][_oCurrentParts[i]] === undefined)) {
					bIsAllPartsReady = false;
				}
			}
		} else {
			bIsAllPartsReady = false;
		}

		return bIsAllPartsReady;
	}


	function _PreloadAndDraw(nFrame) {
		if (!_oMovieProperties) {
			return;
		}

		_LoadFrame(nFrame, _DrawFrame);		
	}

	function _PreloadOtherFrames(nExceptFrame) {
		for (var i = 1; i < _oMovieProperties['totalFrames']; i++) {
			if (i + nExceptFrame < _oMovieProperties['totalFrames']) {
				_LoadFrame(nExceptFrame + i);
			} 

			if (nExceptFrame - i >= 0) {
				_LoadFrame(nExceptFrame - i);
			}
		}
	}

	function _LoadFrame(nFrame, fCallback) {
		fCallback = fCallback || function(n) {};

		if (_IsFrameExisted(nFrame)) {
			fCallback(nFrame);
			return;
		}


		var aImgsToLoad = {};
		var nTotalToLoad = 0;
		var nTotalLoaded = 0;
		
		_aImgs[nFrame] = _aImgs[nFrame] || {};

		for (var i in _oMovieProperties['parts']) {
			_aImgs[nFrame][i] = _aImgs[nFrame][i] || {};
			if (_aImgs[nFrame][i][_oCurrentParts[i]] === undefined) {
				aImgsToLoad[nFrame] = aImgsToLoad[nFrame] || {};
				aImgsToLoad[nFrame][i] = aImgsToLoad[nFrame][i] || {};
				aImgsToLoad[nFrame][i][_oCurrentParts[i]] = _GetImgFullPath(i, nFrame);
				nTotalToLoad++;
			}
		}

		for (var n in aImgsToLoad) {
			n = parseInt(n, 10);
			for (var k in aImgsToLoad[n]) {
				for (var j in aImgsToLoad[n][k]) {
					(function(nn, kk, jj) {
						var img = new Image();
						img.onload = function() {
							nTotalLoaded++;
							_aImgs[nn] = _aImgs[nn] || {};
							_aImgs[nn][kk] = _aImgs[nn][kk] || {};
							_aImgs[nn][kk][jj] = img;

							if (nTotalLoaded >= nTotalToLoad) {
								fCallback(nFrame);
							}
						};

						img.src = aImgsToLoad[nn][kk][jj];
					})(n, k, j);			
				}
			}		
		}
	}

	function _ClearCanvas() {
		_hContext.fillStyle = _oMovieProperties['background'];
		_hContext.fillRect(0, 0, _nCanvasW, _nCanvasH);
	}

	function _DrawFrame(nFrame) {
		if (nFrame === undefined) {
			nFrame = _nCurrentFrame;
		}
		
//console.log('drawing frame ' + nFrame + ', params: ' + _oCurrentParts['front_logo']);

		_ClearCanvas();
		for (var i in _oMovieProperties['parts']) {
			if ((_aImgs[nFrame] === undefined) || (_aImgs[nFrame][i] === undefined) || (_aImgs[nFrame][i][_oCurrentParts[i]] === undefined)) {
//console.log('frame does not exist ' + nFrame + ', part: '+  _oCurrentParts[i]);
				return false;
			}

			_hContext.drawImage(_aImgs[nFrame][i][_oCurrentParts[i]], 0, 0);
		}			

		return true;
	}


	$.fn.betsey = function( method ) {
		if (!_self) {
			_self = this;
		}

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
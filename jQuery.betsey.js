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
		_aFrames = {},
		_aEvents = {},
		_nCurrentFrame = 0,
		_nCurrentZoom = 1;

	var _aRegisteredEventNames = {
		F_ON_MOVIE_PROPS_LOADED : 		'onMoviePropsLoaded',
		F_ON_FRAME_LOADED : 			'onFrameLoaded',
		F_ON_ALL_FRAMES_LOADED : 		'onAllFramesLoaded'
	}

	var _settings = {
		moviesRootURL : window.location + 'content/',
		moviePropertiesFileName : 'properties.js',
		maxZoom : 2.0,
		minZoom: 0.3,
		debug : false
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
			/*
			if (options['movieName'] !== undefined) {
				_LoadMovie(options['movieName']);
			}
			*/
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

		changePartVariant : function(sPartName, sVariant) {
			_ChangePart(sPartName, sVariant);
		},

		getPartVariants : function() {
			return _oCurrentParts;
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

		addScale : function(nScaleModifier) {
			var nPrevZoom = _nCurrentZoom;
			_nCurrentZoom += nScaleModifier;
			if (_nCurrentZoom < _settings['minZoom']) {
				_nCurrentZoom = _settings['minZoom'];
			}
			if (_nCurrentZoom > _settings['maxZoom']) {
				_nCurrentZoom = _settings['maxZoom'];
			}

			_nCurrentZoom = Number(_nCurrentZoom.toFixed(1));
			if (nPrevZoom !== _nCurrentZoom) {
				_DrawFrame();
			}
		},

		setScale : function(nScaleModifier) {	
			var nPrevZoom = _nCurrentZoom;		
			_nCurrentZoom = nScaleModifier;
			if (_nCurrentZoom < _settings['minZoom']) {
				_nCurrentZoom = _settings['minZoom'];
			}
			if (_nCurrentZoom > _settings['maxZoom']) {
				_nCurrentZoom = _settings['maxZoom'];
			}

			_nCurrentZoom = Number(_nCurrentZoom.toFixed(1));
			if (nPrevZoom !== _nCurrentZoom) {
				_DrawFrame();
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


		for (var i in _oMovieProperties.parts) {
			for (var ii in _oMovieProperties.parts[i].variants) {
				_oCurrentParts[i] = ii;
				break;				
			}
		} 

		_aEvents[_aRegisteredEventNames.F_ON_MOVIE_PROPS_LOADED](movieProperties);
		_PreloadFrames();
	}

	function _OnLoadingMovieFailed(jqxhr, settings, exception) {
		_bIsMovieLoading = false;
		$.error('Cannot load movie "' + _sCurrentMovie + '", reason: ' + exception);
	}

	function _ChangePart(sPartName, sVariant) {
		_oCurrentParts[sPartName] = sVariant;
		_PreloadFrames();
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

	function _PreloadFrames() {
		var nPreloadedFrames = 0;
		for (var i = 0; i < _oMovieProperties['totalFrames']; i++) {
			_LoadFrame(i, function(nFrame) {
				_aEvents[_aRegisteredEventNames.F_ON_FRAME_LOADED](nFrame);
				if (++nPreloadedFrames >= _oMovieProperties['totalFrames']) {
					_aEvents[_aRegisteredEventNames.F_ON_ALL_FRAMES_LOADED]();
					_DrawFrame();
				}
			});
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

		for (var i in _oMovieProperties.parts) {
			_aImgs[nFrame][i] = _aImgs[nFrame][i] || {};
			if (_aImgs[nFrame][i][_oCurrentParts[i]] === undefined) {
				aImgsToLoad[nFrame] = aImgsToLoad[nFrame] || {};
				aImgsToLoad[nFrame][i] = aImgsToLoad[nFrame][i] || {};
				aImgsToLoad[nFrame][i][_oCurrentParts[i]] = _GetImgFullPath(i, nFrame);
				nTotalToLoad++;
			}
		}				
		if (nTotalToLoad === 0) {
			fCallback(nFrame);
			return;
		}

		for (var n in aImgsToLoad) {
			n = parseInt(n, 10);
			for (var k in aImgsToLoad[n]) {
				for (var j in aImgsToLoad[n][k]) {
					//console.log('to load: ' + n + '-' + k + '-' + j);

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
		_hContext.fillStyle = _oMovieProperties.background;
		_hContext.fillRect(0, 0, _nCanvasW, _nCanvasH);
	}

	function _DrawFrame(nFrame) {
		if (nFrame === undefined) {
			nFrame = _nCurrentFrame;
		}
				
		if (_settings.debug) {
			var nFrameStartTime = new Date().getTime();
		}
//console.log('drawing frame ' + nFrame + ', params: ' + _oCurrentParts['front_logo']);

		_ClearCanvas();
		var nNewW = _nCanvasW * _nCurrentZoom;
		var nNewH = _nCanvasH * _nCurrentZoom;
		var nImgDrawn = 0;

		for (var i in _oMovieProperties.parts) {
			if ((_aImgs[nFrame] === undefined) || (_aImgs[nFrame][i] === undefined) || (_aImgs[nFrame][i][_oCurrentParts[i]] === undefined)) {
//console.log('frame does not exist ' + nFrame + ', part: '+  _oCurrentParts[i]);
				return false;
			}
			_hContext.drawImage(_aImgs[nFrame][i][_oCurrentParts[i]], (_nCanvasW - nNewW) / 2, (_nCanvasH - nNewH) / 2, nNewW, nNewH);
			nImgDrawn++;
		}	

		if (_settings.debug) {
			_hContext.fillStyle = "white";
			_hContext.font = "bold 12px Courier";
			_hContext.textAlign = "right";
			_hContext.fillText("imgs: " + nImgDrawn, 745, 35);
			_hContext.fillText("frame: " + nFrame, 745, 45);
			_hContext.fillText("zoom: " + _nCurrentZoom, 745, 55);

			_hContext.fillText("RT: " + (new Date().getTime() - nFrameStartTime), 745, 15);
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
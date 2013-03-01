(function( $ ){
	var _self = null,
		_$canvas = null,
		_nCanvasW = 0,
		_nCanvasH = 0,
		_hContext = null,
		_sCurrentMovie = '',
		_sCurrentPath = '',
		_oCurrentPartVariants = {},
		_bIsMovieLoading = false,
		_oMovieProperties = null,
		_aFrames = {},
		_aEvents = {},
		_nCurrentFrame = 0,
		_nCurrentZoom = 1;

	var _aRegisteredEventNames = {
		F_ON_MOVIE_LOADED : 'onMovieLoaded',
		F_ON_INITIAL_FRAME_LOADED : 'onInitialFrameLoaded',
		F_ON_OTHER_FRAME_LOADED : 'onOtherFrameLoaded'
	};

	var _settings = {
		moviesRootURL : window.location + 'content/',
		moviePropertiesFileName : 'properties.js',
		maxZoom : 2.0,
		minZoom: 0.3,
		debug : false
	};

	var PART_TYPE_BACKGROUND = 'background',
		PART_TYPE_SOLID = 'solid',
		PART_TYPE_COLOR_OVERLAY = 'color_overlay';


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
		_oCurrentPartVariants = {};


		for (var p in _oMovieProperties.parts) {
			if (_oMovieProperties.parts[p].type !== PART_TYPE_BACKGROUND) {
				for (var v in _oMovieProperties.parts[p].variants) {
					_oCurrentPartVariants[p] = v;
					break;				
				}
			} else {
				_oCurrentPartVariants[p] = '__betsey_base';
			}
		} 

		_aEvents[_aRegisteredEventNames.F_ON_MOVIE_LOADED](movieProperties);

		_PreloadAndDraw(_oMovieProperties['startFromFrame']);
	}

	function _OnLoadingMovieFailed(jqxhr, settings, exception) {
		_bIsMovieLoading = false;
		$.error('Cannot load movie "' + _sCurrentMovie + '", reason: ' + exception);
	}

	function _ChangePart(sPartName, sVariant) {
		_oCurrentPartVariants[sPartName] = sVariant;
		_PreloadAndDraw(_nCurrentFrame);
	}

	function _ClearCanvas() {
		_hContext.fillStyle = _oMovieProperties['background'];
		_hContext.fillRect(0, 0, _nCanvasW, _nCanvasH);
	}

	function _GetBackgroundImgPath(sPart, nFrame) {
		return _sCurrentPath + '/images/' + sPart + '/' + nFrame + '.' + _oMovieProperties['fileExtensions'];
	}

	function _GetColorOverlayImgPath(sPart, nFrame) {
		return _sCurrentPath + '/images/' + sPart + '/' + nFrame + '.' + _oMovieProperties['fileExtensions'];
	}

	function _GetSolidImgPath(sPart, sVariant, nFrame) {
		return _sCurrentPath + '/images/' + sPart + '/' + sVariant + '/' + nFrame + '.' + _oMovieProperties['fileExtensions'];	
	}


	function _PreloadAndDraw(nFrame) {
		if (!_oMovieProperties) {
			return;
		}

		_LoadFrame(nFrame, function(isFrameAlreadyExists, nFrame) {
			if (!isFrameAlreadyExists) {
				_aEvents[_aRegisteredEventNames.F_ON_INITIAL_FRAME_LOADED](nFrame);	
			}

			_DrawFrame();
			_PreloadOtherFrames(nFrame);
		});		
	}

	function _PreloadOtherFrames(nExceptFrame) {
		for (var i = 1; i < _oMovieProperties['totalFrames']; i++) {
			if (i + nExceptFrame < _oMovieProperties['totalFrames']) {
				_LoadFrame(nExceptFrame + i, function(isFrameAlreadyExists, nFrame) {
					if (!isFrameAlreadyExists) {
						_aEvents[_aRegisteredEventNames.F_ON_OTHER_FRAME_LOADED](nFrame);
					}					
				});
			} 

			if (nExceptFrame - i >= 0) {
				_LoadFrame(nExceptFrame - i, function(isFrameAlreadyExists, nFrame) {
					if (!isFrameAlreadyExists) {
						_aEvents[_aRegisteredEventNames.F_ON_OTHER_FRAME_LOADED](nFrame);
					}						
				});
			}
		}
	}


	function _IsSpriteExisted(sPart, sVariant, nFrame) {
		if (_aImgs[sPart] === undefined) {
			return false;
		}

		switch (_oMovieProperties.parts[sPart].type) {
			case PART_TYPE_BACKGROUND : 
				if (_aImgs[sPart].base_frames[nFrame] === undefined) {
					return false;
				}
				break;

			case PART_TYPE_COLOR_OVERLAY :
			case PART_TYPE_SOLID : 
				if ((_aImgs[sPart].variants === undefined) || 
					(_aImgs[sPart].variants[sVariant] === undefined) || 
					(_aImgs[sPart].variants[sVariant][nFrame] === undefined)) {
					return false;
				}
				break;

			default : 
				return false;
		}	
		return true;
	}


	function _LoadFrame(nFrame, fCallback) {
		fCallback = fCallback || function(n) {};


/*test
nFrame = 0;
_aImgs = {
	'base' : {
		type : 'background',
		base_frames : {
			'0' : true,
			'1' : true
		}
	},

	'body' : {
		type : 'color_overlay',
		base_frames : {
			'0' : true,
			'1' : true
		},
		variants : {
			'white' : {
				'0' : true,
				'1' : true
			},
			'red' : {
				'0' : true,
				'1' : true
			}	
		}
	},

	'front_logo' : {
		type : 'solid',
		variants : {
			'metallic' : {
				'0' : true,
				'1' : true
			},
			'red' : {
				'0' : true,
				'1' : true
			}	
		}
	},

	'wheels' : {
		type : 'solid',
		variants : {
			'default_15in' : {
				'0' : true,
				'1' : true
			}
		}
	}
};*/


		var bIsAlreadyLoaded = true,
			aImgsToLoad = {},			
			nToLoad = 0,
			nLoaded = 0;

		for (var p in _oMovieProperties.parts) {
			var sCurVariant = _oCurrentPartVariants[p];
			if (_IsSpriteExisted(p, sCurVariant, nFrame)) {
				continue;
			}

			aImgsToLoad[p] = aImgsToLoad[p] || {};
			nToLoad++;

			if (_oMovieProperties.parts[p].skip_frames !== undefined) {
				if (_oMovieProperties.parts[p].skip_frames.indexOf(nFrame) !== -1) {
					continue;
				}
			}

			switch (_oMovieProperties.parts[p].type) {
				case PART_TYPE_BACKGROUND : 				
					aImgsToLoad[p]['__betsey_base'] = _GetBackgroundImgPath(p, nFrame);
					break;

				case PART_TYPE_COLOR_OVERLAY :
					if ((_aImgs[p] === undefined) || (_aImgs[p].base_frames[nFrame] === undefined)) {
						aImgsToLoad[p]['__betsey_base'] = _GetColorOverlayImgPath(p, nFrame);
					} else {
						_aImgs[p] = _aImgs[p] || {};
						_aImgs[p].variants = _aImgs[p].variants || {};
						_aImgs[p].variants[sCurVariant] = _aImgs[p].variants[sCurVariant] || {};
						_aImgs[p].variants[sCurVariant][nFrame] = _ApplyColorChanging(_aImgs[p].base_frames[nFrame], _oMovieProperties.parts[p].variants[sCurVariant].color_modification);						
						nToLoad--;
					}

					break;

				case PART_TYPE_SOLID : 
					aImgsToLoad[p] = aImgsToLoad[p] || {};
					aImgsToLoad[p][sCurVariant] = _GetSolidImgPath(p, sCurVariant, nFrame);
					break;
			}

			bIsAlreadyLoaded = false;
		}

		if (!nToLoad) {
			fCallback(true, nFrame);
		}

		for (var p in aImgsToLoad) {
			for (var v in aImgsToLoad[p]) {
				(function(pp, vv, ff) {
					var img = new Image();
					img.onload = function() {
						nLoaded++;
						_aImgs[pp] = _aImgs[pp] || {};
						if (vv === '__betsey_base') {
							_aImgs[pp].base_frames = _aImgs[pp].base_frames || {};
							_aImgs[pp].base_frames[ff] = img;
						} else {							
							_aImgs[pp].variants = _aImgs[pp].variants || {};
							_aImgs[pp].variants[vv] = _aImgs[pp].variants[vv] || {};
							_aImgs[pp].variants[vv][ff] = img;
						}

						if (nLoaded >= nToLoad) {
							fCallback(false, nFrame);
						}
					};

					img.src = aImgsToLoad[pp][vv];
				})(p, v, nFrame);		
			}	
		}	
	}


	function _ApplyColorChanging(img, colorParams) {
		return img;
		_hContext.save();
		_hContext.clearRect(0,0, _nCanvasW, _nCanvasH);
		_hContext.drawImage(img, 0, 0);
		var pixels = _hContext.getImageData(0, 0, _nCanvasW, _nCanvasH);
		_hContext.restore();
		
		console.log(pixels);
	}

	function _DrawFrame(nFrame) {
		if (nFrame === undefined) {
			nFrame = _nCurrentFrame;
		}
		
		if (_settings.debug) {
			var nFrameStartTime = new Date().getTime();
		}

		console.log('drawing frame ' + nFrame + ', scale: ' + _nCurrentZoom);
		_ClearCanvas();
		var nNewW = _nCanvasW * _nCurrentZoom;
		var nNewH = _nCanvasH * _nCurrentZoom;

		var nImgDrawn = 0;
		for (var p in _oMovieProperties.parts) {
			if (!_IsSpriteExisted(p, _oCurrentPartVariants[p], nFrame)) {
				continue;
			}

			if (_oMovieProperties.parts[p].type === PART_TYPE_BACKGROUND) {
				_hContext.drawImage(_aImgs[p].base_frames[nFrame], (_nCanvasW - nNewW) / 2, (_nCanvasH - nNewH) / 2, nNewW, nNewH);	
			} else {	
				_hContext.drawImage(_aImgs[p].variants[_oCurrentPartVariants[p]][nFrame], (_nCanvasW - nNewW) / 2, (_nCanvasH - nNewH) / 2, nNewW, nNewH);			
			}
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
/*

		


	function _IsFrameExisted(nFrame) {
		var bIsAllPartsReady = true;
		if (_aImgs[nFrame] !== undefined) {
			for (var i in _oMovieProperties['parts']) {
				if (!bIsAllPartsReady || (_aImgs[nFrame][i] === undefined) || (_aImgs[nFrame][i][_oCurrentPartVariants[i]] === undefined)) {
					bIsAllPartsReady = false;
				}
			}
		} else {
			bIsAllPartsReady = false;
		}

		return bIsAllPartsReady;
	}
	function _LoadFrame(nFrame, fCallback) {
		fCallback = fCallback || function(n) {};

		if (_IsFrameExisted(nFrame)) {
			fCallback(true, nFrame);
			return;
		}


		var aImgsToLoad = {};
		var nTotalToLoad = 0;
		var nTotalLoaded = 0;
		
		_aImgs[nFrame] = _aImgs[nFrame] || {};

		for (var i in _oMovieProperties['parts']) {
			_aImgs[nFrame][i] = _aImgs[nFrame][i] || {};
			if (_aImgs[nFrame][i][_oCurrentPartVariants[i]] === undefined) {
				aImgsToLoad[nFrame] = aImgsToLoad[nFrame] || {};
				aImgsToLoad[nFrame][i] = aImgsToLoad[nFrame][i] || {};
				aImgsToLoad[nFrame][i][_oCurrentPartVariants[i]] = _GetImgFullPath(i, nFrame);
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

							_aImgs[nn][kk] = _aImgs[nn][kk] || 	{
																	type : _oMovieProperties.parts[kk].type,
																	parts : {}
																};


							switch (_oMovieProperties.parts[kk].type) {
								case PART_TYPE_SOLID :
									_aImgs[nn][kk].parts[jj] = img; 
									break;

								case PART_TYPE_COLOR_OVERLAY : 
									_aImgs[nn][kk].parts[jj] = img;
									break
							} 

							if (nTotalLoaded >= nTotalToLoad) {
								fCallback(false, nFrame);
							}
						};

						img.src = aImgsToLoad[nn][kk][jj];
					})(n, k, j);			
				}
			}		
		}
	}

	function _DrawFrame(nFrame) {
		if (nFrame === undefined) {
			nFrame = _nCurrentFrame;
		}
		
		console.log('drawing frame ' + nFrame + ', scale: ' + _nCurrentZoom);
		for (var i in _oMovieProperties['parts']) {
			if ((_aImgs[nFrame] === undefined) || (_aImgs[nFrame][i] === undefined) || (_aImgs[nFrame][i].parts[_oCurrentPartVariants[i]] === undefined)) {
				console.log('frame does not exist ' + nFrame + ', part: '+  _oCurrentPartVariants[i]);
				return false;
			}
		}

		_ClearCanvas();
		for (var i in _oMovieProperties['parts']) {
			var nNewW = _nCanvasW * _nCurrentZoom;
			var nNewH = _nCanvasH * _nCurrentZoom;
			_hContext.drawImage(_aImgs[nFrame][i].parts[_oCurrentPartVariants[i]], (_nCanvasW - nNewW) / 2, (_nCanvasH - nNewH) / 2, nNewW, nNewH);
		}		
		return true;
	}
	*/

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
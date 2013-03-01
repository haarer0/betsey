var movieProperties = {
	fileExtensions : 'png',
	startFromFrame : 0,
	totalFrames : 36,

	background : '#171717',

	parts : {
		'base' : {
			name : 'Car base layer',
			variants : {
				'default' : {
					name : 'Car base layer'
				}
			}
		},

		'body' : {
			name : 'Car color',
			variants : {
				'white' : {
					name : 'White',
					_color : '#fff'					
				},
				'black' : {
					name : 'Black',
					_color : '#000'					
				},
				'red' : {
					name : 'Red',
					_color : '#f00'					
				},
				'green' : {
					name : 'Green',
					_color : '#0f0'					
				},
				'blue' : {
					name : 'Blue',
					_color : '#00f'					
				},
				'yellow' : {
					name : 'Yellow',
					_color : '#ff0'					
				},
				'pink' : {
					name : 'Pink',
					_color : '#f0f'					
				},
			}
		},

		'front_logo' : {
			name : 'Front logo',
			variants : {
				'metallic' : {
					name : 'Default',	
					_color : '#aaa'	
				},
				'blue' : {
					name : 'Blue',
					_color : '#55a'		
				}
			},
			skip_frames : [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
		}

	}
}
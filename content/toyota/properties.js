var movieProperties = {
	fileExtensions : 'png',
	startFromFrame : 0,
	totalFrames : 36,

	background : '#171717',



	parts : {
		'base' : {
			name : 'Car base layer',
			type : 'background',
			variants : {
				'base' : {
					name : 'Car base layer'
				}
			}
		},

		'body' : {
			name : 'Car body color',
			type : 'color_overlay',
			variants : {
				'white' : {
					name : 'White color'
					color_modification : {a : 0, r : 0, g : 0, b : 0}					
				},

				'red' : {
					name : 'Red color'
					color_modification : {a : 0, r : 100, g : 0, b : 0}					
				},

				'blue' : {
					name : 'White color'
					color_modification : {a : 0, r : 0, g : 0, b : 100}					
				},

				'green' : {
					name : 'White color'
					color_modification : {a : 0, r : 0, g : 100, b : 0}					
				}
			}
		},

		'front_logo' : {
			name : 'Front logo',
			type : 'solid',
			variants : {
				'metallic' : {
					name : 'Default color'
					color_modification : {a : 0, r : 0, g : 0, b : 0}			
				},
				'blue' : {
					name : 'White color'
					color_modification : {a : 0, r : 0, g : 0, b : 100}					
				}
			}
		},


		'wheels' : {
			name : 'Car wheels',
			type : 'solid',
			variants : {
				'default_15in' : {
					name : 'Default 15" whhels'
					color_modification : {a : 0, r : 0, g : 0, b : 0}					
				},

				'luxury_15in' : {
					name : 'Luxury 15" whhels'
					color_modification : {a : 0, r : 0, g : 0, b : 0}					
				}
			}
		}
/*
 	parts : {
		'body' : {
			name : 'Car body',
			type : 'solid',
			variants : {
				'white' : {
					name : 'white color'
				},
				'red' : {
					name : 'red color'
				}
			}
		},

		'front_logo' : {
			name : 'Toyota logo (front)',
			type : 'color_overlay',
			variants : {
				'metallic' : {
					color_modification : {a : 0, r : 0, g : 0, b : 0},
					name : 'in metallic'
				},
				'blue' : {
					color_modification : {a : 0, r : 0, g : 0, b : 100},
					name : 'blue plastic'
				},
				'blue' : 'blue plastic'
			}
		}
	}
	*/
}
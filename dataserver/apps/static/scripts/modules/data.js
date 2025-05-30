/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

DATA OBJECT

Author: Justin Winslow
Last updated: 06/22/2012 by Justin Winslow

*/

ss.data = {}

ss.data.fromString = function(string){
	//console.log(string);
	var dataComponents = (string)?string.split('.'):0,
		deviceTypeConversion = {
			panel: 'pnl',
			'string': 'str',
			inverter: 'inv',
			combiner: 'cmb',
			pnl: 'pnl',
			str: 'str',
			inv: 'inv',
			cmb: 'cmb',
			array: 'array',
			sitearray: 'array',
			env: 'env'
		},
		myData = {};

		//var index = function(i, obj) {return obj[i]}
		//myData = string.split('.').reduce(index, ss.data);

	if(dataComponents){
		var myDeviceType = deviceTypeConversion[dataComponents[0].toLowerCase()];

		if(myDeviceType){
			if(dataComponents[1]){
				myData = ss.data[myDeviceType][dataComponents[1]]._default;
			}
			if(dataComponents[2]){
				myData = ss.data[myDeviceType][dataComponents[1]][dataComponents[2]]._default;
			}
			if(dataComponents[3]){
				myData = ss.data[myDeviceType][dataComponents[1]][dataComponents[2]][dataComponents[3]];
			}
		}

		myData.deviceType = myDeviceType;
	}

	return myData;
}

/* Environmentals */
ss.data.env = {
	irradiance: {
		_default: {
			id: 'irradiance_mean',
			name: 'Irradiance',
			axisLabel: 'Irradiance (W/m²)',
			color: '#ffb218'
		},
		mean: {
			id: 'irradiance_mean',
			name: 'Irradiance',
			axisLabel: 'Irradiance (W/m²)',
			color: '#ffb218'
		}
	},
	temperature: {
		_default: {
			name: 'Ambient Temperature',
			axisLabel: 'Degrees Celcius',
			color: '#E41A1C'
		},
		panel: {
			name: 'Panel Temperature',
			axisLabel: 'Degrees Celcius',
			color: '#FF7F00'
		},
		ambient: {
			name: 'Ambient Temperature',
			axisLabel: 'Degrees Celcius',
			color: '#E41A1C'
		}
	}
}

/* Array */

ss.data.array = {
	power: {
		_default:{
			id: 'P',
			name: 'Power',
			axisLabel: 'Watts',
			color: '#06c'
		}
	}
}

/* Inverters */
ss.data.inv = {
	power: {
		_default: {
			id: 'P',
			name: 'Power',
			axisLabel: 'Watts',
			color: '#06c'
		}
	},
	current: {
		_default: {
			id: 'I',
			name: 'Current',
			axisLabel: 'Amps',
			color: '#00a651'
		}
	},
	voltage: {
		_default: {
			id: 'V',
			name: 'Voltage',
			axisLabel: 'Volts',
			color: '#9e005d'
		}
	}
}
ss.data.inv.p = ss.data.inv.power;
ss.data.inv.i = ss.data.inv.current;
ss.data.inv.v = ss.data.inv.voltage;

/* Deck */
ss.data.deck = {
	power: {
		_default: {
			id: 'Po',
			name: 'AC Power Out',
			axisLabel: 'Watts',
			color: '#06c'
		},
		i: {
			_default: {
				id: 'Pi',
				name: 'DC Power In',
				axisLabel: 'Watts',
				color: '##02205f'
			}
		},
		o: {
			_default: {
				id: 'Po',
				name: 'AC Power Out',
				axisLabel: 'Watts',
				color: '#7fbfff'
			}
		}
	}
}
ss.data.deck.p = ss.data.inv.power;

/* Combiners */
ss.data.cmb = {}
ss.data.cmb.power = ss.data.inv.power;
ss.data.cmb.current = ss.data.inv.current;
ss.data.cmb.voltage = ss.data.inv.voltage;
ss.data.cmb.p = ss.data.inv.power;
ss.data.cmb.i = ss.data.inv.current;
ss.data.cmb.v = ss.data.inv.voltage;

/* Strings */
ss.data.str = {}
ss.data.str.power = ss.data.inv.power;
ss.data.str.current = ss.data.inv.current;
ss.data.str.voltage = ss.data.inv.voltage;
ss.data.str.p = ss.data.inv.power;
ss.data.str.i = ss.data.inv.current;
ss.data.str.v = ss.data.inv.voltage;

ss.data.str.voltage.prime = {
	id: 'V_prime',
	name: 'Voltage (Inference)',
	color: '#f16eaa',
	axisLabel : 'Volts'
}

/* Panels */
ss.data.pnl = {
	power: {
		_default: {
			id: 'Po_mean',
			name: 'Power Out',
			axisLabel: 'Watts',
			color: '#06c'
		},
		i: {
			_default: {
				id: 'Pi_mean',
				name: 'Power In',
				axisLabel: 'Watts',
				color: '#7fbfff'
			},
			mean: {
				id: 'Pi_mean',
				name: 'Power In',
				axisLabel: 'Watts',
				color: '#7fbfff'
			},
			max: {
				id: 'Pi_max',
				name: 'Power In (max)',
				axisLabel: 'Watts',
				color: ''
			},
			min: {
				id: 'Pi_min',
				name: 'Power In (min)',
				axisLabel: 'Watts',
				color: ''
			},
			stdev: {
				id: 'Pi_stdev',
				name: 'Power In (stdev)',
				axisLabel: 'Watts',
				color: ''
			}
		},
		o: {
			_default: {
				id: 'Po_mean',
				name: 'Power Out',
				axisLabel: 'Watts',
				color: '#06c'
			},
			mean: {
				id: 'Po_mean',
				name: 'Power Out',
				axisLabel: 'Watts',
				color: '#06c'
			},
			max: {
				id: 'Po_max',
				name: 'Power Out (max)',
				axisLabel: 'Watts',
				color: ''
			},
			min: {
				id: 'Po_min',
				name: 'Power Out (min)',
				axisLabel: 'Watts',
				color: ''
			},
			stdev: {
				id: 'Po_stdev',
				name: 'Power Out (stdev)',
				axisLabel: 'Watts',
				color: ''
			}
		}
	},
	current: {
		_default: {
			id: 'Io_mean',
			name: 'Current Out',
			axisLabel: 'Amps',
			color: '#00a651'
		},
		i: {
			mean: {
				id: 'Ii_mean',
				name: 'Current In',
				axisLabel: 'Amps',
				color: '#acd473'
			},
			max: {
				id: 'Ii_max',
				name: 'Current In (max)',
				axisLabel: 'Amps',
				color: ''
			},
			min: {
				id: 'Ii_min',
				name: 'Current In (min)',
				axisLabel: 'Amps',
				color: ''
			},
			stdev: {
				id: 'Ii_stdev',
				name: 'Current In (stdev)',
				axisLabel: 'Amps',
				color: ''
			}
		},
		o: {
			mean: {
				id: 'Io_mean',
				name: 'Current Out',
				axisLabel: 'Amps',
				color: '#00a651'
			},
			max: {
				id: 'Io_max',
				name: 'Current Out (max)',
				axisLabel: 'Amps',
				color: ''
			},
			min: {
				id: 'Io_min',
				name: 'Current Out (min)',
				axisLabel: 'Amps',
				color: ''
			},
			stdev: {
				id: 'Io_stdev',
				name: 'Current Out (stdev)',
				axisLabel: 'Amps',
				color: ''
			}
		}
	},
	voltage: {
		_default: {
			id: 'Vo_mean',
			name: 'Voltage Out',
			axisLabel: 'Volts',
			color: '#9e005d'
		},
		i: {
			mean: {
				id: 'Vi_mean',
				name: 'Voltage In',
				axisLabel: 'Volts',
				color: '#f16eaa'
			},
			max: {
				id: 'Vi_max',
				name: 'Voltage In (max)',
				axisLabel: 'Volts',
				color: ''
			},
			min: {
				id: 'Vi_min',
				name: 'Voltage In (min)',
				axisLabel: 'Volts',
				color: ''
			},
			stdev: {
				id: 'Vi_stdev',
				name: 'Voltage In (stdev)',
				axisLabel: 'Volts',
				color: ''
			}
		},
		o: {
			mean: {
				id: 'Vo_mean',
				name: 'Voltage Out',
				axisLabel: 'Volts',
				color: '#9e005d'
			},
			max: {
				id: 'Vo_max',
				name: 'Voltage Out (max)',
				axisLabel: 'Volts',
				color: ''
			},
			min: {
				id: 'Vo_min',
				name: 'Voltage Out (min)',
				axisLabel: 'Volts',
				color: ''
			},
			stdev: {
				id: 'Vo_stdev',
				name: 'Voltage Out (stdev)',
				axisLabel: 'Volts',
				color: ''
			}
		}
	}
}

ss.data.pnl.p = ss.data.pnl.power;
ss.data.pnl.i = ss.data.pnl.current;
ss.data.pnl.v = ss.data.pnl.voltage;
define( ['jquery'], function ($) {

ss.chartBuilder = {
	lines : 0,

	line : {
		_init : function(){
			var that = this;
			//console.log('init');
			ss.chartBuilder.lines++;

			this.lineNumber = ss.chartBuilder.lines;

			var newLine = [
				'<div id="lineDefinition_' + this.lineNumber + '" class="lineDefinition">',
					'<a href="#removeLine" class="removeLine">Remove Line</a>',
					'<h4>Line ' + this.lineNumber + '</h4>',
					'<div id="deviceSelector_' + this.lineNumber + '" class="deviceSelector">',
						'<input id="selectDevice_' + this.lineNumber + '" name="selectDevice" class="facade" type="text" placeholder="Start typing to add device">',
						'<input id="selectDevice_' + this.lineNumber + '_id" name="selectDevice" class="value" type="hidden">',
					'</div>',
					'<select id="Data_' + this.lineNumber + '" name="Data_' + this.lineNumber + '" class="selectData" disabled>',
						'<option value="">- Select Data Type -</option>',
					'</select>',
				'</div>'
			]

			var myLine = $(newLine.join(''));
			
			this.$element = myLine;

			$('form#chartBuilder > div.container_buttons').before(myLine);

			var populateSelect = function(){
				var mySelect = that.$element.find('select'),
				    isEnvData = (that.$element.find('.deviceSelector .value').val() === 'env')?true:false,
				    envOptions = [
						'<option value="">- Select Data Type -</option>',
						'<option value="irradiance_mean">Irradiance</option>',
						'<option value="panel_temperature_mean">Panel Temp</option>',
						'<option value="ambient_temperature_mean">Ambient Temp</option>'
					],
					devOptions = [
						'<option value="">- Select Data Type -</option>',
						'<option value="Pi_mean">Power</option>',
						'<option value="Ii_mean">Current</option>',
						'<option value="Vi_mean">Voltage</option>'
					];

					
					if(ss.user.role === 'S'){
						devOptions = [
							'<option value="">- Select Data Type -</option>',
							'<option value="Pi_mean">Power In</option>',
							'<option value="Po_mean">Power Out</option>',
							'<option value="Pi_stdev">Power (stdev)</option>',
							'<option value="Pi_min">Power (min)</option>',
							'<option value="Pi_max">Power (max)</option>',
							'<option value="Ii_mean">Current In</option>',
							'<option value="Io_mean">Current Out</option>',
							'<option value="Ii_stdev">Current (stdev)</option>',
							'<option value="Ii_min">Current (min)</option>',
							'<option value="Ii_max">Current (max)</option>',
							'<option value="Vi_mean">Voltage In</option>',
							'<option value="Vo_mean">Voltage Out</option>',
							'<option value="Vi_stdev">Voltage (stdev)</option>',
							'<option value="Vi_min">Voltage (min)</option>',
							'<option value="Vi_max">Voltage (max)</option>'
						]	
					}

				if(isEnvData){
					mySelect.html(
						envOptions.join('')
					);
				}else{
					mySelect.html(
						devOptions.join('')
					);
				}

				mySelect.removeAttr('disabled');
			}


			ss.modules.create('deviceSelectors', {
				afterSelect:populateSelect, 
				id: 'deviceSelector_' + that.lineNumber, 
				attachTo: $('#deviceSelector_' + this.lineNumber).get()
			});
		}
	},

	chartTemplate : function(parameters){
		return {
			type : 'chart',
			title : 'Custom Chart',
			deviceType : parameters.deviceType,
			deviceID : parameters.deviceID,
			dataType : parameters.dataType,
			chartType : 'spline',
			addClass : 'fullHeight'
		}
	},

	buildChart : function(){
		var parameters = {
			//deviceType : '',
			//deviceID : '',
			//dataType : ''
		}

		$('.lineDefinition').each(function(index){
			var myDevice = $(this).find('input.value').val(),
				myData = $(this).find('select.selectData option:selected').val();
			//console.log($(this).closest('.lineDefinition').find('select.selectData option:selected'))
			//console.log(myData)

			var myDeviceType = function(){
				if(myDevice === 'env'){
					return 'env'
				}else{
					switch (myDevice.charAt(0)){
						case 'P':
							return 'opt';
							break;
						case 'S':
							return 'strcalc';
							break;
						case 'I':
							return 'invcalc';
							break;
						default:
							return 'opt';
					}
				}
			}
			
			var myDataType = function(){
				if(myDevice === 'env'){
					return myData;
				}else if(ss.devices.allNodesById[myDevice].devtype === 'Panel'){
					return myData;	 
				}else{
					return myData.charAt(0);
				}
			}

			if(myDevice && myData){
				$(this).closest('.lineDefinition').find('.message').remove();

				if(index > 0){
					parameters.deviceID = parameters.deviceID + '+' + myDevice;
					parameters.deviceType = parameters.deviceType + '+' + myDeviceType();
					parameters.dataType = parameters.dataType + '+' + myDataType();
				}else{
					parameters.deviceID = myDevice;
					parameters.deviceType = myDeviceType();
					parameters.dataType = myDataType();
				}
			}else{
				if(!myDevice){
					ss.errorMessages({
						element:$(this).closest('.lineDefinition'),
						type:'error',
						content:'No device selected',
						fixed:true
					});	
				}else if(!myData){
					ss.errorMessages({
						element:$(this).closest('.lineDefinition'),
						type:'error',
						content:'No data type selected',
						fixed:true
					});	
				}
			}
		});

		//console.log(parameters)

		/*parameters['deviceID'] = $(this).find('input[name$=deviceID]').val();
		parameters['deviceType'] = $(this).find('input[name$=deviceType]').val();
		parameters['dataType'] = $(this).find('input[name$=dataType]').val();*/
		
		//var myChart = ss.chartBuilder.chartTemplate(parameters);

		//ss.charts.manualChart.add(myChart);

		if(parameters.deviceID){//
			ss.modules.create('charts', ss.chartBuilder.chartTemplate(parameters));

			//ss.layout.fillVertically();
		}
	},

	_addListeners : function(){
		$('form#chartBuilder').submit(function(event){
			event.preventDefault();
			//ss.charts.manualChart.remove();
			if($('.module.chart').length){
				//console.log('chart exists')
				var currentChart = $('.module.chart').data('module');
				//console.log(currentChart);
				
				currentChart.destroy();
			}
			
			ss.chartBuilder.buildChart();
		});

		$('div.chartBuilder_controls').delegate('a.addLine', 'click', function(event){
			event.preventDefault();
			ss.chartBuilder.addLine();
		});

		$('div.chartBuilder_controls').delegate('a.removeLine', 'click', function(event){
			event.preventDefault();
			$(this).closest('div.lineDefinition').remove();
		});
	},

	addLine : function(){
		var myLine = Object.create(this.line);
		
		myLine._init();
	},

	_init : function(){
		//console.log('chart builder init');
		require(['layoutHelpers', 'devices'], function(layout, devices){
			$(document).ready(function(){
				
				if( $('.fullHeight').length ){
					ss.layouts.find();
				}

				$('.chartBuilder_controls').find('img.loading').hide();
				//console.log('init')
				ss.chartBuilder.addLine();
				ss.chartBuilder._addListeners();
				/*
				require(['modules/charts'], function(){
					// Move reset zoom button for chart builder 
					//ss.charts.defaultOptions.chart.resetZoomButton.position.y = 50;
					ss.charts.chart.proto._chartOptions.timeline.chart.resetZoomButton.position.align = 'right';
					ss.charts._chartOptions.timeline.chart.resetZoomButton.position.y = 48;
				});
				*/
			});
		});
	}
}

});//end define
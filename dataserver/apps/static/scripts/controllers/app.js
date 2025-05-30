/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

APP FRAMEWORK

Author: Justin Winslow
Last updated: 08/05/2012 by Justin Winslow

*/

define( ['jquery'], function ($) {

/* Touch device support for hover nav */
if ('ontouchstart' in document.documentElement) {
	$('div.page_nav').bind('touchstart', function(){
		$(this).addClass('pageNavHover');
	});

	$('div.page_nav').bind('touchend', function(){
		$(this).removeClass('pageNavHover');
	});
}

ss.app = {
	_init: function(){
		//console.log('app init');
		require(['layoutHelpers', 'devices', 'moduleFactory'], function(layout, devices){
			$(document).ready(function(){

				if( $('.fullHeight').length ){
					ss.layouts.find();
				}

				/*
				if($('.dateSelection').length){
					ss.dateSelection.init();
				}
				*/

				// Set device based on presence of hash
				//console.log('app init');
				if($('body#page_dashboard').length || $('#deviceDetail').length){
					ss.modules.create('arrayNav', document.getElementById('arrayNavContainer'));

					ss.modules.create('breadcrumbs', document.getElementById('breadcrumbs'));

					$(document).bind('setDevice', function(event, data){
						//var changeTemplateTimeout = setTimeout(ss.changeTemplate, 250);
						ss.changeTemplate(data.deviceId);
					});

					ss.devices.dataDefer.done(function(){
						if(window.location.hash && window.location.hash.replace('#', '')){

							//ss.setDevice(window.location.hash.replace('#', ''));
							//console.log(window.location.hash.replace('#', ''));
							$(document).trigger('setDevice', {deviceId: window.location.hash.replace('#', '')});

							//window.location.hash = '';
						}else{
							//ss.setDevice(ss.devices.allNodesByType.SiteArray.id);
							//console.log('no hash');
							$(document).trigger('setDevice', {deviceId: ss.devices.allNodesByType.SiteArray.id});
						}
					});

					// update hash to device node on device set
					$(document).bind('setDevice', function(event, data){
						window.location.hash = data.deviceId;
					});

					/*
					$(window).bind('hashchange', function(){
						// bind the set device mechanism to a change in hash to accommodate the back button
						//console.log('hash change');
						//console.log(window.location.hash)
						$(document).trigger('setDevice', {deviceId: window.location.hash.replace(/#/g,'')});
					});
					*/
				}

				if($('a.link_popUp').length){
					ss.popUps.find();
				}

				/* Date listeners */
				ss.automation._init();
			});
		});
	}
}

ss.automation = {
	_init: function(){
		var that = this;
		require(['dates'], function(dates){
			that.run();
			that._addListeners();
		});
	},

	run: function(){
		//console.log('automate');

		var checkDate = function(){
			var date = new Date(),
			    dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
			    currentDate = ss.dates.max('utc') || dateUTC;

			if(currentDate && dateUTC == currentDate){
				return true;
			}else{
				return false;
			}
		}

		//console.log(checkDate())

		var doUpdate = function(){
			$(document).trigger('updateModules');
		}

		if(checkDate()){
			//console.log('today')
			this.updateInterval = setInterval(doUpdate, 300000)
		}else{
			clearInterval(this.updateInterval);
		}

		//console.log(this.updateInterval);
	},

	_addListeners: function(){
		var that = this;

		$(document).bind('setDate', function(){
			that.run();
		});
	}
}

ss.changeTemplate = function(deviceId){
	//console.log('change template', deviceId);
	var pageTemplates = {//Maybe make this a function that returns an array of objects to get rid of the expressions
		SiteArray_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'full',
				deviceType: 'env+arraycalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},/*
			{
				type: 'issues',
				title: 'Faults',
				size: 'half'
			},*/
			{
				type: 'charts',
				title: 'Inverters Power',
				size: 'full',
				deviceType: 'invcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'All Faults',
				size: 'full',
				issue_type: 'faults'
			}
		],

		Inverter_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: (ss.devices.allData.sitearray.inverter_metering)?'env+invcalc+' + ss.devices.allData.sitearray.inverter_metering:'env+invcalc',
				deviceID: (ss.devices.allData.sitearray.inverter_metering)?'env+{{node}}+{{node}}':'env+{{node}}',
				dataType: (ss.devices.allData.sitearray.inverter_metering)?'irradiance_mean+P+Pi-Po':'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'invcalc',
				deviceID: '{{node}}',
				dataType: 'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Strings Power',
				size: 'full',
				deviceType: 'strcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		Inverter_withCombiners: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: 'env+invcalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'invcalc',
				deviceID: '{{node}}',
				dataType: 'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Combiners Power',
				size: 'full',
				deviceType: 'comcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		InverterCombiner_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: 'env+invcalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'invcalc',
				deviceID: '{{node}}',
				dataType: 'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Combiners Power',
				size: 'full',
				deviceType: 'comcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		Combiner_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: 'env+comcalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'comcalc',
				deviceID: '{{node}}',
				dataType: 'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Strings Power',
				size: 'full',
				deviceType: 'strcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		Recombiner_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: 'env+rcomcalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'rcomcalc',
				deviceID: '{{node}}',
				dataType: 'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Combiners Power',
				size: 'full',
				deviceType: 'comcalc',
				deviceID: '{{node}}',
				dataType: 'P',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		String_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Power and Irradiance',
				size: 'half',
				deviceType: 'env+strcalc',
				deviceID: 'env+{{node}}',
				dataType: 'irradiance_mean+P',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current and Voltage',
				size: 'half',
				deviceType: 'strcalc',
				deviceID: '{{node}}',
				dataType: (ss.user.role === 'S')?'I-V-V_prime':'I-V',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Panels Power',
				size: 'full',
				deviceType: 'opt+invcalc',
				deviceID: '{{node}}+{{Inverter}}',
				dataType: 'Po_mean+Po_mean',
				chartType: 'spline'
			},
			{
				type: 'charts',
				addClass: 'multi',
				title: 'Panels Voltage',
				size: 'full',
				deviceType: 'opt+invcalc',
				deviceID: '{{node}}+{{Inverter}}',
				dataType: 'Vo_mean+Vo_mean',
				chartType: 'spline'
			},
			/*{
				type: 'charts',
				addClass: 'multi',
				title: 'Panels Current',
				size: 'full',
				deviceType: 'opt',
				deviceID: '{{node}}',
				dataType: 'Io_mean',
				chartType: 'spline'
			},*/
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}
		],

		Panel_default: [
			{
				type: 'maps',
				title: 'Array Map',
				size: 'full',
				overlay: 'relativePower',
				defaultRotation: '',
				northOffset: ''
			},
			{
				type: 'charts',
				title: 'Irradiance and Power',
				size: 'half',
				deviceType: 'invcalc+env+opt',
				deviceID: '{{Inverter}}+env+{{node}}',
				dataType: 'Po_mean+irradiance_mean+Po_mean',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Voltage and Current',
				size: 'half',
				deviceType: 'invcalc+opt',
				deviceID: '{{Inverter}}+{{node}}',
				dataType: 'Vo_mean-Io_mean+Vo_mean-Io_mean',
				chartType: 'spline'
			},
			{
				type: 'issues',
				title: 'Faults',
				size: 'full',
				issue_type: 'faults',
				node: '{{node}}'
			}/*,
			{
				type: 'charts',
				title: 'Power I/O Average',
				size: 'half',
				deviceType: 'opt',
				dataType: 'Pi_mean-Po_mean',
				chartType: 'spline'
			},
			{
				type: 'charts',
				title: 'Current I/O Average',
				size: 'half',
				deviceType: 'opt',
				dataType: 'Ii_mean-Io_mean',
				chartType: 'spline'
			}*/
		]
	},
		myDevice = ss.devices.allNodesById[deviceId],
		myDeviceType =  myDevice.devtype,
		newDeviceLayout,
		$container = $('.container_modules');

	if(myDeviceType === 'Inverter' && ss.devices.allNodesByType.Inverter[0].inputs[0].devtype === "Combiner"){
		newDeviceLayout = myDeviceType.replace(' ', '_') + '_withCombiners';
	}else{
		newDeviceLayout = myDeviceType.replace(' ', '_') + '_default';
	}

	var hasModules = function(type){
		if(pageTemplates[newDeviceLayout]){
			for(var i=0, pageTemplatesLength=pageTemplates[newDeviceLayout].length;i<pageTemplatesLength;i++){
				if(pageTemplates[newDeviceLayout][i].type === type){
					return true;
					break;
				}
			}
		}
	}

	// Do module cleanup before appending new ones
	if($('.module').length){//Make sure modules exist before acting on them
		$.each($('.module'), function(module){
			if(!$(this).hasClass('map')){
				var myModule = $(this).data('module'),
					$parentContainer = $(this).closest('.container');

				myModule.destroy();
				$parentContainer.remove();
			}
		});
	}

	// Hide Maps if appropriate but don't remove to save DOM cycles
	if(hasModules('maps') === false){
		$('.module.map').hide();
	}else{
		if(!$('.module.map').length){
			$container.append('<div id="container_arrayMap" class="container fullWidth" />');

			ss.modules.create('maps', document.getElementById('container_arrayMap'), {
				size:'full'
			});
		}else{
			$('.module.map').show();
		}
	}

	if(pageTemplates[newDeviceLayout]){//Check if layout exists
		// Loop through module templates in new page layout and build each
		for(var template=0, templatesLength=pageTemplates[newDeviceLayout].length; template<templatesLength; template++){
			var module = pageTemplates[newDeviceLayout][template];

			//Since maps are handled independently don't include them here
			if(module.type !== 'maps'){
				var uniqueId = Math.floor(
		                Math.random() * 0x10000 /* 65536 */
		            ).toString(16),
					$parentContainer = $('<div id="container_' + uniqueId + '" class="container ' + module.size + 'Width" />');

				$container.append($parentContainer);

				for(var property in module){
					module[property] = module[property].replace(/{{node}}/g, myDevice.id);
					module[property] = module[property].replace(/{{parent}}/g, myDevice.parent);

					if(myDevice.parentNodes && myDevice.parentNodes['Inverter']){
						module[property] = module[property].replace(/{{Inverter}}/g, myDevice.parentNodes['Inverter'][0]);
					}
				}

				module.id = module.type + '_' + uniqueId;

				ss.modules.create(module.type, document.getElementById('container_' + uniqueId), module);
			}
		}
	}
}

return ss.app;

});//end require
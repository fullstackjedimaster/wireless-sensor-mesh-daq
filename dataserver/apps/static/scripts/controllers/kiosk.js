/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

KIOSK FRAMEWORK

Author: Justin Winslow
Last updated: 08/02/2012 by Justin Winslow

*/

define( ['jquery'], function ($) {

if(!window.ss){
	ss = {};
}

require(['statusWidgets'], function(statusWidgets){
	statusWidgets.template = function(options){
		return [
			'<div class="module arrayStatus">',
				'<div class="title">',
					'<h3>Energy Generation</h3>',
				'</div>',
				'<div class="content">',
					'<div class="energyHistory">',
						'<ul>',
							'<li>',
								'<h4>Today</h4>',
								'<span class="value today">0</span> <span class="unit">kWh</span>',
							'</li>',
							'<li>',
								'<h4>Week to Date</h4>',
								'<span class="value week">0</span> <span class="unit">kWh</span>',
							'</li>',
							'<li>',
								'<h4>Month to Date</h4>',
								'<span class="value month">0</span> <span class="unit">MWh</span>',
							'</li>',
							'<li>',
								'<h4>Year to Date</h4>',
								'<span class="value year">0</span> <span class="unit">MWh</span>',
							'</li>',
						'</ul>',
					'</div>',
				'</div>',
			'</div>'
		]
	}
});

ss.kiosk = {
	_init : function(){
		require(['dates'], function(dates){
			dates.min = function(format){/* Change the date object min to use the max - 2 days */
				var myDate = ($('input[name=max_date]').length)?$('input[name=max_date]').val().split('-'):[this.today.getFullYear(), (this.today.getMonth() + 1), this.today.getDate()];

				if(format === 'UTC' || format === 'utc'){
					return Date.UTC(+myDate[0], (+myDate[1]-1), (+myDate[2]-2));
				}else{
					return myDate[0] + '-' + myDate[1] + '-' + (myDate[2]-2);
				}
			}

			$.post('/ss/date_range/', 'min_date=' + ss.dates.min() + '&max_date=' + ss.dates.max()).success(function(data){
				$(document).ready(function(){
					ss.modules.create('statusWidgets', document.getElementById('container_arrayStatus'));

					ss.modules.create('charts', document.getElementById('container_powerAndIrradiance'), {
						id: 'powerAndIrradiance',
						deviceType: 'env+arraycalc',
						deviceID: 'env+SA-1',
						dataType: 'irradiance_mean+P',
						chartType: 'spline',
						title: 'Power+Generation+Compared+to+Available+Sun+Energy',
						downloadWidget: false,
						template: 'kiosk',
						size: 'full'
					});

					ss.modules.create('weatherWidgets', $('.column_group')[0]);

					ss.automation.automate();
				});
			});
		});
	}
}

ss.automation = {
	updateModules : function(){
		$(document).trigger('updateModules');
	},

	checkDate : function(){
		var date = new Date(),
		    dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
		    currentDate = ss.dates.max('utc') || dateUTC;

		if(currentDate && dateUTC == currentDate){
			return true;
		}else{
			return false;
		}
	},

	automate : function(){
		var that = this;

		function doUpdate(){
			that.updateModules();
		}

		if(this.checkDate()){
			//console.log('today')
			this.updateInterval = setInterval(doUpdate, 300000)
		}else{
			clearInterval(this.updateInterval);
		}
	}
}

return ss.kiosk;

});
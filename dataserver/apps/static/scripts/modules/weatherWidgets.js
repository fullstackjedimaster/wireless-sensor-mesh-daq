/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

WEATHER WIDGETS

Author: Justin Winslow
Last updated: 08/09/2012 by Justin Winslow

http://api.wunderground.com/api/< API key >/conditions/q/< zip code >.json
API Key = 2d4c32f1d7e792cb

*/

define( ['jquery', 'static/scripts/modules/urls', 'devices'], function ($, urls, devices) {

ss.weatherWidgets = {
	//myWeatherWidgets : [],

	template : function(options){
		return [
			'<div class="module weather">',
				'<div class="content">',
					'<div class="description">',
						'<p class="temperature"></p>',
						'<p class="status"></p>',
					'</div>',
					'<div class="icon"></div>',
				'</div>',
			'</div>'
		].join('');
	},

	weatherWidget : {
		_init : function(options, appendToElement){
			//console.log('init');

			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			//ss.weatherWidgets.myWeatherWidgets.push(this);   //Make a reference to this object to be able to access its methods

			this.$element = $(ss.weatherWidgets.template(this.options));
			this.element = this.$element[0];

			if(appendToElement){
				$(appendToElement).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			var that = this;

			devices.dataDefer.done(function(){
				that._getData();
			});
		},

		_getData : function(){
			var that = this;

			$.ajax({
				url: 'http://api.wunderground.com/api/2d4c32f1d7e792cb/conditions/q/' + ss.devices.allData.sitearray.zipcode + '.json',
				cache: false,
				dataType: 'jsonp',
				success: function(data){
					//console.log(data);
					that.weatherData = data;
					that._build();
				},
				error: function(data){
					//console.log(data);
					ss.errorMessages({
						element:that.$element,
						type:'error',
						content:'Data failed to load',
						fixed:(that.options.deviceID.length > 1)?false:true
					});

					that.$element.children('.content').children('img.loading').hide();
				}
			});
		},

		_build : function(){
			//console.log('build');
			this.$element.find('img.loading').hide();

			//console.log(this.weatherData.current_observation.temp_f);
			this.$element.find('.icon').addClass(this.weatherData.current_observation.icon)
			this.$element.find('.temperature').html(roundNumber(this.weatherData.current_observation.temp_f, 0) + '\&deg\;');
			this.$element.find('.status').text(this.weatherData.current_observation.weather);
		},

		update : function(){
			//do update
			//console.log('update')

			//this.$element.find('img.loading').show();
			this._getData();
		}
	}
}

return ss.weatherWidgets.weatherWidget;

});//end define
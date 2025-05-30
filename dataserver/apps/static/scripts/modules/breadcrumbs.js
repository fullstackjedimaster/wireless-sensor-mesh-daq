define( ['jquery', 'static/scripts/modules/devices'], function ($, devices) {

ss.breadcrumbs = {
	_init : function(options, el){
		//console.log('breadcrumb init', options)
		var that = this;
		
		this.element = el;
		this.$element = $(el);

		this.options = $.extend({}, this.options, options);

		devices.dataDefer.done(function(){
			if(!options.node){
				var node = window.location.hash.replace('#', '') || devices.allNodesByType.SiteArray.id;

				that.options.node = node;
			}
			
			that._build();
			that._addListeners();
		});
	},

	_build : function(){
		//console.log(this.data);
		var newBreadcrumb = $('<ul />'),
		    myDevice = devices.allNodesById[this.options.node];

		/* Add array item */
		newBreadcrumb.append('<li><a href="#' + devices.allNodesByType.SiteArray.id + '" class="deviceNavigation">Array</a></li>');

		if(myDevice.devtype !== 'SiteArray'){
			/* Loop through parents and add them to the bread crumb */
			for(var parent in myDevice.parentNodes){
				if(parent !== 'SiteArray'){
					var newParent = $('<li><a href="#' + myDevice.parentNodes[parent][0] + '" class="deviceNavigation">' + myDevice.parentNodes[parent][1] + '</a></li>');
				
					newBreadcrumb.append(newParent);
				}
			}

			/* Add current device */
			newBreadcrumb.append('<li><a href="#' + myDevice.id + '" class="deviceNavigation">' + myDevice.label + '</a></li>');
		}
		
		/* Add list to dom */
		this.$element.append(newBreadcrumb);
	},

	_addListeners : function(){
		var that = this;

		this.$element.delegate('a.deviceNavigation', 'click', function(event){
			event.preventDefault();
			event.stopPropagation();

			//window.location.hash = $(this).attr('href');

			$(document).trigger('setDevice', {deviceId: $(this).attr('href').replace(/#/g,'')});
			//ss.setDevice($(this).attr('href').replace(/#/g,'')); //Navigation object in script.js
		});

		$(document).bind('setDevice.breadcrumb', function(e, data){
			that.update(data.deviceId);
		});
	},

	currentDeviceType : function(){
		return devices.allNodesById[this.options.node].devtype;
	},

	currentDeviceID : function(){
		return this.options.node;
	},

	update : function(deviceID){
		if($('div.breadcrumbs ul').length){
			$('div.breadcrumbs ul').remove();
		}
		this.options.node = deviceID;
		this._build();
	},

	options : {
		//node : devices.allNodesByType.SiteArray.id
	}
}

return ss.breadcrumbs;

});//end define
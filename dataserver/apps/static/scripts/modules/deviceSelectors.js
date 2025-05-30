define( ['jquery', 'jquery-helpers', 'static/scripts/modules/devices'], function ($, jqhelpers, devices) {

ss.deviceSelectors = {
	//myDeviceSelectors : [],
	/*
	Loop through device dict
	for each device type loop through it's members
	for each member create an object with label, id and other keywords:
	{
		label : human readable label
		id : node id
		type : device type
		keywords : array with my node label and id and all my parent nodes labels and ids
	}
	push object to array

	text box with class deviceSelector
	on key press create a div and make it as wide as the text box and some arbitrary height
	populate div with objects that match
	when device is clicked, set value of text field to node id

	keywords are weighted as a secondary importance, this may just work itself out in the loop
	*/
	deviceSelector : {
		_init : function(options){
			//console.log('Device Selector Init()');
			
			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			//deviceselectors.myDeviceSelectors.push(this);	//Make a reference to this object to be able to access its methods

			this.element = this.options.attachTo;//Create dom reference to container element
			this.$element = $(this.options.attachTo);//Create jQuery reference to container element
			
			var that = this;

			devices.dataDefer.done(function(){
				that._populateDictionary();
				that._build();
				that._addListeners();
			});
		},

		_populateDictionary : function(){
			//console.log(allNodes)
			this._deviceDictionary = [];//Instantiate the dictionary

			this._deviceDictionary.push({
				displayName : 'Environment', 
				label : 'env',
				id : 'env',
				type : 'env',
				keywords : 'environment temperature irradiance'
			});

			for(var deviceType = 1, deviceTypeLength=devices.nodeTypes.length; deviceType<deviceTypeLength; deviceType++){
				for(device=0,devicesLength=devices.allNodesByType[devices.nodeTypes[deviceType]].length; device<devicesLength; device++){
					var myDevice = devices.allNodesByType[devices.nodeTypes[deviceType]][device];

					var parentDevices = function(){
						var myParents = '';

						if(myDevice.parentNodes){
							for(var deviceType in myDevice.parentNodes){
								if(deviceType !== 'SiteArray'){
									myParents = myParents + myDevice.parentNodes[deviceType][1] + ' &raquo; '
								}
							}
						}

						return myParents;
					}

					var newDevice = {
						displayName : myDevice.devtype + ' - ' + parentDevices() + '<strong>' + myDevice.label + '</strong>',
						//displayName : (myDevice.devtype == 'Panel')?'Panel ' + myDevice.label + ' on String ' + myDevice.parentNodes['String'][1] : myDevice.devtype + ' ' + myDevice.label, 
						label : myDevice.label,
						id : myDevice.id,
						type : myDevice.devtype,
						keywords : ' ' + myDevice.devtype + ' ' + myDevice.label + ' ' + myDevice.id
					}

					if(myDevice.parentNodes){
						var myParents = myDevice.parentNodes;

						for(var parent in myParents){
							newDevice.keywords = newDevice.keywords + ' ' + myParents[parent][0] + ' ';
							newDevice.keywords = newDevice.keywords + ' ' + myParents[parent][1] + ' ';
						}
					}

					this._deviceDictionary.push(newDevice);
				}
			}
		},

		_build : function(){
			//build drop down on focus?
			if($('.deviceSelectorList').length){
				this.myDropDown = $('.deviceSelectorList');
			}else{
				var that = this,
					myDropDown = [
						'<div id="' + this.options.id + '_deviceSelectorList" class="deviceSelectorList" style="display:none;">',
							'<ul>'
					];
				
				for(var device=0, devicesLength=this._deviceDictionary.length; device<devicesLength; device++){
					//console.log(device)
					myDropDown.push(
						'<li' + 
						' id="' + this.options.id + '_deviceSelectorItem_' + device + 
						'" class="deviceSelectorItem_' + device + 
						'"><a href="#' + this._deviceDictionary[device].id + '" class="deviceSelectorItem">' + 
						this._deviceDictionary[device].displayName + 
						'</a></li>'
					);
				}

				myDropDown.push('</ul></div>');

				this.myDropDown = $(myDropDown.join(''));

				$('body').append(this.myDropDown);
			}
		},

		appendDevice : function(device){
			//console.log('appendDevice', this, this._deviceDictionary);

			/* Method for manually adding arbitrary devices */
			var myDevice = device;

			this._deviceDictionary.push(myDevice);

			this.myDropDown.find('ul').prepend(
				'<li id="' + 
				this.options.id + '_deviceSelectorItem_' + (this._deviceDictionary.length-1) + 
				'" class="deviceSelectorItem_' + (this._deviceDictionary.length-1) + 
				'"><a href="#' + myDevice.id + '" class="deviceSelectorItem">' + 
				myDevice.displayName + '</a></li>'
			);
		},

		_position : function(){
			var myElementPosition = this.$element.offset();

			this.myDropDown.css({
				width : this.options.width || this.$element.width(),
				'max-height' : Math.min(this.options.height, ($(window).height() - myElementPosition.top - this.$element.outerHeight() - 12)),
				top : this.$element.outerHeight() + myElementPosition.top,
				left : myElementPosition.left
			});
		},

		show : function(){
			//Add to the dom
			
			this._position();
			this.myDropDown.show();
			this.isVisible = true;
			//this.filter(this.$element.val());//Filter on initial display if field has text in it
		},

		hide : function(){
			this.myDropDown.hide();
			//this.myDropDown.detach();
			this.isVisible = false;
		},

		filter : function(string){
			//console.log('filter', string);
			
			//filter list based on string argument
			for(var device=0, devicesLength=this._deviceDictionary.length; device<devicesLength; device++){
				if(this._deviceDictionary[device].keywords){
					var myString = this._deviceDictionary[device].keywords.toLowerCase(),
					    myFilters = string.toLowerCase().split(' '),
					    matches = 0;

					for(var filter=0, filtersLength=myFilters.length; filter<filtersLength; filter++){
						if(myString.indexOf(myFilters[filter]) >= 0){
							
							matches++;
							//this.myDropDown.find('.deviceSelectorItem_' + device).show();
							//continue;
						}
					}

					if(matches === myFilters.length){
						document.getElementById(this.options.id + '_deviceSelectorItem_' + device).style.display = '';
					}else{
						document.getElementById(this.options.id + '_deviceSelectorItem_' + device).style.display = 'none';
					}
				}
			}
		},

		destroy : function(){
			//Remove element
			this.$element.remove();
			
			//Remove events
			this.myDropDown.off();
			this.$element.find('input.facade').off();
			this.$element.find('input.value').off();
		},

		_addListeners : function(){
			var that = this,
			    facadeInput = this.$element.find('input.facade'),
			    valueInput = this.$element.find('input.value');

			$(window).smartresize(function(event){
				that._position();
			});
			
			this.$element.click(function(event){
				event.stopPropagation();
			});

			facadeInput.click(function(event){
				if(!this.isVisible){
					that.show();
				}
			});

			facadeInput.focus(function(event){
				that.show();
			});

			this.myDropDown.click(function(event){
				event.stopPropagation();
			});

			$('body').click(function(event){
				that.hide();
			});

			this.myDropDown.delegate('a.deviceSelectorItem', 'click', function(event){
				event.preventDefault();

				if(that.isVisible){
					var myDevice = devices.allNodesById[$(this).attr('href').replace('#', '')];
					
					//Save the device ID to the hidden input
					valueInput.val($(this).attr('href').replace('#', ''));

					//If the device exists in the all nodes dictionary use it's label, else use the display label from the LI
					facadeInput.val((myDevice)?myDevice.label:$(this).text());
					
					that.options.afterSelect();

					that.hide();
				}
			});

			facadeInput.keyup(function(event){
				//console.log($(this).val());
				var myValue = $(this).val();

				/* Clear the value of the hidden input */
				valueInput.val('');

				if(that._filterTimeout){
					clearTimeout(that._filterTimeout);
				}

				var runFilter = function(){
					that.filter(myValue);
				}
				
				that._filterTimeout = setTimeout(runFilter, 300);
			});
		},

		options : {
			height : 300,
			width : 240,
			afterSelect : function(){}
		}
	}
}

return ss.deviceSelectors.deviceSelector;

});//end define
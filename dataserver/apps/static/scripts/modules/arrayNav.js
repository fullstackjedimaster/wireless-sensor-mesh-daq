define( ['jquery', 'static/scripts/modules/devices'], function ($, devices) {

ss.arrayNav = {
	_init : function(parameters, element){
		//console.log('nav init');
		var that = this;

		this.element = element;
		this.$element = $(element);
		//console.log(ss.myArray);

		devices.dataDefer.done(function(){
			var currentDevice = window.location.hash.replace('#', '') || false;

			that.arrayData = devices.allData.sitearray;
			that._build();

			if(currentDevice){
				that.setActiveDevice(currentDevice);
			}

			that._addListeners();
		});
	},

	_build : function(){
		//var perfStart = new Date(), perfJS, perfDOM;
		//console.log('build array nav')
		var data = this.arrayData,
			myNav = [];
		
		myNav.push('<div id="array_' + data.id + '" class="array"><a href="#' + data.id + '" class="deviceNavigation">' + data.location + '</a></div>');

		var monitorType = function(string){
			var myType = '';
			
			if(string === 'null' || string === null){
				myType = 'uncommissioned';
			}else if(string === 'SPO'){
				myType = 'optimized';
			}

			return myType;
		}
		
		if(data.inputs && data.inputs.length>0){//check if inverters exist, if not run error catch
			myNav.push('<ul class="collapsible">')//Push nav container
			
			for(var a=0, aLength=data.inputs.length; a<aLength; a++){
				/* This assumes top level for building nav is always the inverter */
				var aInputs = data.inputs[a];
				
				if(aInputs.devtype === 'Inverter'){
					myNav.push(
						'<li id="' + 
						aInputs.devtype.replace(/\//g,'') + '_' + aInputs.id + '" class="' + 
						aInputs.devtype.replace(/\//g,'') + ' collapsed"><span class="wrapper_expandCollapse"><a href="#' + 
						aInputs.id + '" class="deviceNavigation">' + 
						aInputs.label + '</a></span>'
					);
					
					if(aInputs.inputs && aInputs.inputs.length>0){
						myNav.push('<ul class="group_' + aInputs.devtype.replace(/\//g,'') + '" style="display:none;">');
						
						for(var b=0, bLength=aInputs.inputs.length; b<bLength; b++){
							var bInputs = aInputs.inputs[b];
							
							myNav.push(
								'<li id="' + 
								bInputs.devtype.replace(/\//g,'') + '_' + bInputs.id + '" class="' + 
								bInputs.devtype.replace(/\//g,'') + ' collapsed"><span class="wrapper_expandCollapse"><a href="#' + 
								bInputs.id + '" class="deviceNavigation">' + 
								bInputs.label + '</a></span>'
							);
							
							if(bInputs.inputs && bInputs.inputs.length>0){
								myNav.push('<ul class="group_' + bInputs.devtype.replace(/\//g,'') + '" style="display:none;">');
								
								for(var c=0, cLength=bInputs.inputs.length; c<cLength; c++){
									var cInputs = bInputs.inputs[c],
										cAddClass = (cInputs.devtype === 'Panel')?monitorType(cInputs.attached):'';
									
									myNav.push(
										'<li id="' + 
										cInputs.devtype.replace(/\//g,'') + '_' + cInputs.id + '" class="' + 
										cAddClass + ' ' +
										cInputs.devtype.replace(/\//g,'') + ' collapsed"><span class="wrapper_expandCollapse"><a href="#' + 
										cInputs.id + '" class="deviceNavigation">' + 
										cInputs.label + '</a></span>'
									);
									
									if(cInputs.inputs && cInputs.inputs.length>0){
										myNav.push('<ul class="group_' + cInputs.devtype.replace(/\//g,'') + '" style="display:none;">');
										
										for(var d=0, dLength=cInputs.inputs.length; d<dLength; d++){
											var dInputs = cInputs.inputs[d],
												dAddClass = (dInputs.devtype === 'Panel')?monitorType(dInputs.attached):'';
											
											myNav.push(
												'<li id="' + 
												dInputs.devtype.replace(/\//g,'') + '_' + dInputs.id + '" class="' + 
												dAddClass + ' ' +
												dInputs.devtype.replace(/\//g,'') + ' collapsed"><span class="wrapper_expandCollapse"><a href="#' + 
												dInputs.id + '" class="deviceNavigation">' + 
												dInputs.label + '</a></span>'
											);
											
											if(dInputs.inputs && dInputs.inputs.length>0){
												myNav.push('<ul class="group_' + dInputs.devtype.replace(/\//g,'') + '" style="display:none;">');
												
												for(var e=0, eLength=dInputs.inputs.length; e<eLength; e++){
													var eInputs = dInputs.inputs[e],
														eAddClass = (eInputs.devtype === 'Panel')?monitorType(eInputs.attached):'';
													
													myNav.push(
														'<li id="' + 
														eInputs.devtype.replace(/\//g,'') + '_' + eInputs.id + '" class="' + 
														eAddClass + ' ' +
														eInputs.devtype.replace(/\//g,'') + ' collapsed"><span class="wrapper_expandCollapse"><a href="#' + 
														eInputs.id + '" class="deviceNavigation">' + 
														eInputs.label + '</a></span></li>'
													);
												}
												
												myNav.push('</ul>');

											}else if(dInputs.devtype == 'String'){
												myNav.push('<ul class="noDeviceMonitors"><li>No device monitors found</li></ul>')
											}

											myNav.push('</li>');
										}

										myNav.push('</ul>');
									}else if(cInputs.devtype == 'String'){
										myNav.push('<ul class="noDeviceMonitors"><li>No device monitors found</li></ul>')
									}

									myNav.push('</li>');
								}

								myNav.push('</ul>');
							}else if(bInputs.devtype == 'String'){
								myNav.push('<ul class="noDeviceMonitors"><li>No device monitors found</li></ul>')
							}

							myNav.push('</li>');
						}

						myNav.push('</ul>');
					}else if(aInputs.devtype == 'String'){
						myNav.push('<ul class="noDeviceMonitors"><li>No device monitors found</li></ul>');
					}
				}
			}
			myNav.push('</ul>'); //Push nav container close
		}else{
			myNav.push('<p class="message warning">No devices found</p>')
		}

		//perfJS = new Date();

		//console.log('JS perf:', perfJS - perfStart);

		this.$element.find('img.loading').hide();
		
		this.$element.append(myNav.join(''));	//Append nav

		//this.toggle('.String > ul', {animate:false});
		//this.toggle('.Inverter ul', {animate:false});	//default to collapsing the panels

		//perfDOM = new Date();

		//console.log('DOM perf:', perfDOM - perfJS);
	},
	
	setActiveDevice : function(deviceId){
		//console.log('setActiveDevice');
		var that = this,
			myDevice = devices.allNodesById[deviceId];

		this.$element.find('span.activeIndicator').remove();

		if(myDevice.devtype !== 'SiteArray'){
			var myEl = this.$element.find('li#' + myDevice.devtype + '_' + myDevice.id),
				scrolledEl = this.$element.parent(),
				myParent = this.$element,
				currentScroll = scrolledEl.scrollTop();

			myEl.prepend('<span class="activeIndicator" />');

			var scrollDiv = function(){
				var myElPosition = myEl.offset();

				if(myElPosition.top < 0 || myElPosition.top > scrolledEl.height()){
					scrolledEl.animate({ scrollTop: currentScroll + myElPosition.top - 100 }, 500);
				}
			}
			
			if(!myEl.parent().is(':visible')){
				//If element is in a collapsed state (not visible), send the scroll div function as a callback after the expand animation
				$.each(myEl.parents('ul'), function(index){
					var $this = $(this);
					if(!$this.is(':visible')){
						that.expand($this, true, scrollDiv);
					}
				});
				
			}else{
				scrollDiv();
			}
		}
	},
	
	collapse : function(element, animate, callback){//animate should be a boolean
		var myEl = this.$element.find(element),
		    callback = callback || function(){};

		if(animate == false || animate == '' || animate == undefined){
			myEl.hide();
			callback();
			myEl.each(function(){
				myEl.parent().addClass('collapsed')
			});
		}else{
			myEl.animate({
				height: 'hide'
				}, 250, function() {
			}).promise().done(callback());
			myEl.each(function(){
				myEl.parent().addClass('collapsed')
			});
		}
	},
	
	expand : function($element, animate, callback){
		var myEl = $element,
		    callback = callback || function(){};

		if(animate == false || animate == '' || animate == undefined){
			myEl.show();
			callback();
			myEl.each(function(){
				myEl.parent().removeClass('collapsed')
			});
		}else{
			myEl.animate({
				height: 'show'
				}, 250, function() {
			}).promise().done(callback());
			myEl.each(function(){
				myEl.parent().removeClass('collapsed')
			});
		}
	},
	
	toggle : function($element, parameters){
		if($element.is(':visible')/*expanded*/){//check if element is hidden or visible
			this.collapse($element, parameters.animate);
		}else{
			this.expand($element, parameters.animate);
		}
	},
	
	_addListeners : function(){
		//console.log('add listeners', this.$element);

		var that = this;

		$(document).bind('setDevice', function(event, data){
			//console.log(data.deviceId);
			that.setActiveDevice(data.deviceId);
		});

		this.$element.delegate('.wrapper_expandCollapse', 'click', function(event){
			event.stopPropagation();
			// Must delegate the expand collapse as well to prevent propagation of the link click
			var $el = $('#' + $(this).parent().attr('id') + ' > ul');
			
			that.toggle($el, {animate:true});
		});

		//Prevent click from percolating to the expand/collapse wrapper
		this.$element.delegate('a.deviceNavigation', 'click', function(event){
			//console.log('click', this)
			event.preventDefault();
			event.stopPropagation();

			$(document).trigger('setDevice', {deviceId: $(this).attr('href').replace('#', '')});
		});

		/*
		$('.collapseAll a').click(function(event){
			event.preventDefault();
			
			if($(this).hasClass('collapsed')){
				$(this).removeClass('collapsed')
			}else{
				$(this).addClass('collapsed')
			}
			that.toggle('#' + $(this).parent().parent().attr('id') + ' ul', true)
		});
		*/
	}
}

return ss.arrayNav;

});//end define
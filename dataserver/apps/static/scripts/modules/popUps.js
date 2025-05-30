/*

	POPUPS

	Author: Justin Winslow
	Last updated: 11/11/2011 by Justin Winslow

*/

define( ['jquery'], function ($) {

ss.popUps = {
	///DEPRECATED - myPopUps : [],

	// Standard template for popUps. Expect id, title, and content to be passed in.
	popUpTemplate : function(options){
		var myTemplate = [
			'<div id="popUp_' + options.id + '" class="popUp" style="display:none;">',
				'<h3>' + options.title + '</h3>',
				'<div class="content">',
					options.content,
				'</div>',
			'</div>'
		];

		return myTemplate.join('');
	},

	popUp : {
		_init : function(options, el){
			//console.log('init');

			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			//DEPRECATED - ss.popUps.myPopUps.push(this);   //Make a reference to this object to be able to access its methods

			// DOM element passed into init is used for triggering the popUp to open.
			this.element = el;
			this.$element = $(el);

			this._build();
			this._addListeners();

			// Assume inactive on init.
			this._active = false;
		},

		_build : function(){
			var that = this;

			// Look for the popUp_obscure element. If it's not there, add it to the page.
			if($('.popUp_obscure').length <= 0){
				$('<div class="popUp_obscure" />').css({opacity:0}).appendTo('body');
			}

			// Dynamic means that the content is retrieved through AJAX 
			// (opposed to being passed in through the options object).
			if(this.options.dynamic === false){
				// If dynamic is false, assume there is an element on the page
				// with has the structure and content of the popUp with the id
				// of options.target
				this.$myPopUp = $('#' + this.options.target);
			}
			else if(this.options.path){
				// otherwise, options.path is the URL to grab the content via ajax.
	
				//Build pop up from template (not sure how this is supposed to work with the module system)
				this.$myPopUp = $(ss.popUps.popUpTemplate({
					// add options to the template, including the loading gif as the content.
					content : '<img src=' + ss.urls.src + '"../../images/icon_loading.gif" class="loading">',
					id : this.options.id || 'dynamic',
					title : this.options.title || 'Dynamic Pop Up'
				}));

				//Add popUp element to dom andd reveal it.
				$('body').append(this.$myPopUp);
				this.show();
				
				//Add content from path via ajax
				var myData = $.ajax({
					url: that.options.path,
					cache: false,
					async: true, //if there are multiple datas for the same chart, disable async so the chart doesn't build prematurely
					
					// On successful loading of data, hide loading gif and add the data to the content of the popUp.
					success: function(data){
						//console.log(data)
						//console.log(deviceIndex + ' of ' + dataRequested)
						that.$myPopUp.find('img.loading').hide();
						that.$myPopUp.find('.content').append(data);

						// call _position() to center the popUp on the page.
						that._position();
					},

					// If there is an error, call the error message module, passing in
					// the popUp element as it's primary element.
					error: function(){
						ss.errorMessages({
							div:'popUp_' + that.options.id,
							type:'error',
							content:'Data failed to load',
							fixed:true
						});	
						
						// Hide the loading gif.
						that.$myPopUp.find('img.loading').hide();
					}
				});

				// if the Window is closed during ajax request, kill the the request.
				$(window).unload(function(event){
					myData.abort();
				});
			} // END this.options.path if statement
			// if its not dyanmic, but there is no "this.options.target" on the page,
			// The content will be passed in directly.
			else if(this.options.content){
				
				// Build the element from the template.
				this.$myPopUp = $(ss.popUps.popUpTemplate({
					/* add options */
					content : this.options.content,
					id : this.options.id || 'dynamic',
					title : this.options.title || 'Dynamic Pop Up'
				}));

				// Add the element to the document body.
				$('body').append(this.$myPopUp);

				// and run the show function.
				this.show();
			}
			
			// create a custom width and padding for the message (there are default options for these).
			this.$myPopUp.css({
				width : this.options.width,
				padding : this.options.padding
			});

			// Add the close link to the popUp based on the closeLink opiton.
			// This defaults to true. I'm curious when it wouldn't be.
			if(this.options.closeLink === true && this.$myPopUp.children('.popUp_close').length == 0){//add close link to pop up
				this.$myPopUp.prepend('<a href="#close" class="close">Close</a>')
			}
		},

		show : function(){
			$('.popUp_obscure').show().animate({
    			opacity: 0.5
    		}, 250);
  

			//.fadeIn(250);
			//console.log(this.$myPopUp)
			this.$myPopUp.fadeIn(250);

			this._position();

			this._active = true;
		},

		hide : function(){
			this.$myPopUp.fadeOut(250);
			$('.popUp_obscure').fadeOut(250); 

			this._active = false;

			if(this.options.dynamic === true){
				this.$myPopUp.remove();//Get rid of dom element
				//DEPRECATED - ss.popUps.myPopUps.pop();//Pop the entry from the array
			}
		},

		// This function centers the popUp on the page and makes sure the
		// popUp_obscure takes the whole height of the page.
		_position : function(){
			$('.popUp_obscure').height($(window).height());
			this.$myPopUp.css({
				top : Math.max(12, ($(window).height()/2 - this.$myPopUp.height()/2)),
				left : Math.max(12, ($(window).width()/2 - this.$myPopUp.width()/2))
			});
		},

		// Here's where we attach all the event listeners to the page and build elements.
		_addListeners : function(){
			var that = this;

			// So, the $element in this case is the thing that triggers
			// the popup to open...
			this.$element.click(function(event){
				event.preventDefault();
				that.show();
			});

			// If the close option is clicked (and present), close the popup and obscurer.
			this.$myPopUp.delegate('.close', 'click', function(event){
				event.preventDefault();
				that.hide();
			});

			// If the popUp_obscure element is clicked, go ahead on close the popUp and the obscure element.
			$('body').delegate('.popUp_obscure', 'click', function(event){
					that.hide();
			});

			// center the popUp and resize the obscurer when the window resizes.
			$(window).smartresize(function(event){
				that._position();	
			});
		},

		options : {
			width : 480,
			padding : 24,
			closable : true, //Save this for later as an idea
			closeLink : true, //Display the close like in the top right
			dynamic : false
		}
	}
}

return ss.popUps.popUp;

});//end define
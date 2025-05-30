// Generic messages module.

// To create a message, follow this pattern:
//
// ss.modules.create('message', {options}*, containerElement*, callback);
//
// options*
//		type*: 		message type. Built-in types are "notification", "error", and "popUp"
//		modal: 		true or false. Defaults to false. Modal messages will block user input.
//		closable: 	true or false. Defaults to true. Closable will allow for a close link/button.
//		autoDie: 	time in milliseconds before the message calls "hide()" on itself.
//					0 indicates does not autoDie. Defaults to 0.
//		template: 	function that returns a string for the dom element. Each built-in type has a
//					template already, so don't override if you don't need to.
//		content*: 	A string that fills in the content of the message. 
//					NOTE: Unlike the popUps module, this does not take a url for an ajax request.
//	   ~~~ Some message types also take type-specific options ~~~
//		id: 		a unique ID to create a DOM id if you need to grab it later.
//		title: 		Title for the <h3> tag in a pop-up.
//
// appendToElement*
//		Whichever DOM element this message will be appended to. Must be a DOM node or jQuery object.
//		This element acts as the container for the message.
//
// callback:
//		Function that takes the message as an argument. Useful if you need to do any manipulation
//		to the content after it is loaded or need to attach event handlers to DOM nodes.
//
// *: Required.
//
// Example:
//	 ss.modules.create('message', {
// 			type: 'popUp',
// 			title: 'Testing a Pop-up',
// 			content: 'Test content. Even <button>HTMLs</button> work.'
// 		}, 
//		$('body'), 
//		callback(message){
//			message.$element.find("button").click(function(e){ message.hide() })
//		})


define( ['jquery', 'jquery-helpers'], function ($) {
// Attach module to ss namespace.
ss.messages = {

	// Global obscure object so that we don't need to worry about
	// keeping more than one obscure for modals on the page.
	obscure: {
		// Hard-coded template for now.
		template: function(){
			return $('<div class="popUp_obscure" />');
		},

		// Stores the jQuerified element on the object.
		// Attach the element to the body, but make sure it's hidden.
		attach: function(){
			this.$element = this.template();
			this.$element.css({opacity:0}).appendTo('body');
		},

		// Make sure the element is the size of the window.
		setHeight: function(){
			this.$element.height($(window).height());
		},

		// Check to see if the obscure element has been created. If not,
		// (create and) attach it first, then set the height to match window size.
		// Finally, fade it in.
		show: function(time){
			if(!this.$element){
				this.attach();
			};
			this.setHeight();
			this.$element.show().animate({ opacity: 0.5 }, time);	
		},

		// Fade the element out.
		hide: function(time){
			this.$element.fadeOut(time);	
		}
	},

	// Message Types are pre-defined options for common messages.
	messageTypes: {

		// Notifications are informational but not critical. They are not modal and
		// automatically disappear after two seconds.
		notification: {
			modal: false,
			closable: false,
			autoDie: 2000,
			template: function(options){
				return [
					'<div class="message warning" style="display:none;">',
							options.closable ? "<a href=class'close'>Close</a>" : '',
							options.content,
					'</div>'
				].join('')
			}
		},

		// Errors are also non-modal, but won't autoDie.
		error: {
			modal: false,
			template: function(options){
				return [
					'<div class="message error" style="display:none;">',
						options.closable ? '<a href="#close" class="close">Close</a>' : '',
						options.content,
					'</div>'
				].join('')
			}
		},

		// Pop-Ups are modal.
		popUp: {
			modal: true,
			template: function(options){
				var id = options.id ? options.id : '';
				return [
					'<div id="popUp_' + id + '" class="popUp" style="display:none;">',
						options.closable ? '<a href="#close" class="close">Close</a>' : '',
						options.title ? '<h3>' + options.title + '</h3>' : '',
						'<div class="content">',
							options.content,
						'</div>',
					'</div>'
				].join('')
			},
			css: {
				padding: 12,
				width: 400
			}
		}
	
	},

	// ss.messages.extend allows you to add custom message types dynamically.
	extend : function(name, inheretedType, options){
		this.messageTypes[name] = $.extend({}, inheretedType, options)
	},

	// Base object for a unique message.
	message : {

		// Default options for a generic message.
		options: {
			modal: false,
			autoDie: 0,
			closable: true,
			css: {}
		},

		// Setup internal properties
		_init : function(options, el){

			// Find out the built-in options for this particular message type.
			var typeOptions = ss.messages.messageTypes[options.type] || {};

			// Create the options object for the newly created message.
			this.options = $.extend({}, this.options, typeOptions, options);
			
			// this.$element is the jQuerified DOM node of this message.
			// It is created from the template property of the particular message type.
			this.$element = $(this.options.template(this.options));

			// Attach the container jQuerified dom element so we can reference it later if we need to.
			this.$appendToElement = $(el);

			// Once everything is initialized call _build() to put it on the page.
			this._build();
			return this;
		},
		
		// Put it on the page.
		_build : function(){
			// We'll check for $appendToElement, but honestly, it's required at this point.
			if(this.$appendToElement){
				// We are prepending the message element to the container element
				// to make sure that the element isn't obscured by something else.
				this.$appendToElement.append(this.$element);
				//console.log(this.$appendToElement)
			}

			this.$element.css(this.options.css);

			this._attachListeners();
			this.show();

		},

		_attachListeners: function(){

			var that = this;
			// If the closable option is clicked (and present), close the popup and obscurer.
			this.$element.delegate('.close', 'click', function(event){
				event.preventDefault();
				that.hide();
			});

			// If the popUp_obscure element is clicked, go ahead on close the popUp and the obscure element.
			$('body').delegate('.popUp_obscure', 'click', function(event){
					that.hide();
			});

			// center the popUp and resize the obscurer when the window resizes.
			$(window).smartresize(function(event){
				that._updatePosition();	
			});
		},

		_updatePosition: function(){
			if(this.options.modal){
				ss.messages.obscure.setHeight();
			
				this.$element.css({
					top : Math.max(12, ($(window).height()/2 - this.$element.height()/2)),
					left : Math.max(12, ($(window).width()/2 - this.$element.width()/2))
				});
			}
		},

		show: function(){
			if(this.options.modal){
				// If we are supposed to have a modal message, show the obscure element
				ss.messages.obscure.show(250);
			}
			// Fade the message element in.
			this._updatePosition();
  			this.$element.fadeIn(250);

  			if(this.options.autoDie > 0){
  				var that = this;
  				setTimeout(function(){ that.hide.apply(that) }, that.options.autoDie)
  			}
		},

		// Hides the message elemen.
		hide: function(){
			// Until we discover otherwise, the hide method just calls the destroy method.
			this.destroy();

			// // Fade the element out.
			// this.$element.fadeOut(250);

			// if(this.options.modal){
			// 	// hide the obscure element if it's a modal message.
			// 	ss.messages.obscure.hide(250);
			// }
		},

		destroy: function(){
			var that = this;
			this.$element.fadeOut(250, function(){
				that.$element.remove();
			});

			if(this.options.modal){
				// hide the obscure element if it's a modal message.
				ss.messages.obscure.hide(250);
			}
		}
	} // End ss.messages.message
} // End ss.messages

return ss.messages.message;

});//end define
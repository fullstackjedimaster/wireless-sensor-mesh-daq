/**
 * @preserve Copyright 2012 Solar Power Technologies
 */

/*

	SPT REUSABLE SCRIPTS AND HELPER FUNCTIONS

	Author: Justin Winslow
	Last updated: 08/02/2012 by Justin Winslow

*/

// Create object support
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// inArray support
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}

Function.prototype.debounce = function (threshold, execAsap) {
    var func = this, timeout;
 
    return function debounced () {
        var obj = this, args = arguments;
        function delayed () {
            if (!execAsap)
                func.apply(obj, args);
            timeout = null; 
        }
 
        if (timeout)
            clearTimeout(timeout);
        else if (execAsap)
            func.apply(obj, args);
 
        timeout = setTimeout(delayed, threshold || 100); 
    }
}

function roundNumber(num, dec) {
	var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
	return result;
}

function preloadImages(images){
	var myImages;
	/*
		{
			src : 'path/to/image',
			alt : 'Alt text'
			width : #,
			height : #
		}
	*/
	if(images){
		if(images.length > 1){
			myImages = [];
			
			for(var image=0;image<images.length;image++){
				myImages[image] = new Image();
				for(var name in images[image]){
					myImages[image][name] = images[image][name];	
				}
			}
		}else{
			myImages = new Image();
			for(var name in images){
				myImages[name] = images[name];	
			}
		}
	}
	
	return myImages;
}



function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

/* Additional helper functions */
function typeOf(value) {
    var s = typeof value;
    if (s === 'object') {
        if (value) {
            if (Object.prototype.toString.call(value) == '[object Array]') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
}

function isEmpty(o) {
    var i, v;
    if (typeOf(o) === 'object') {
        for (i in o) {
            v = o[i];
            if (v !== undefined && typeOf(v) !== 'function') {
                return false;
            }
        }
    }
    return true;
}

/* Additional string methods */
if (!String.prototype.entityify) {
    String.prototype.entityify = function () {
        return this.replace(/&/g, "&amp;").replace(/</g,
            "&lt;").replace(/>/g, "&gt;");
    };
}

if (!String.prototype.quote) {
    String.prototype.quote = function () {
        var c, i, l = this.length, o = '"';
        for (i = 0; i < l; i += 1) {
            c = this.charAt(i);
            if (c >= ' ') {
                if (c === '\\' || c === '"') {
                    o += '\\';
                }
                o += c;
            } else {
                switch (c) {
                case '\b':
                    o += '\\b';
                    break;
                case '\f':
                    o += '\\f';
                    break;
                case '\n':
                    o += '\\n';
                    break;
                case '\r':
                    o += '\\r';
                    break;
                case '\t':
                    o += '\\t';
                    break;
                default:
                    c = c.charCodeAt();
                    o += '\\u00' + Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                }
            }
        }
        return o + '"';
    };
} 

if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
    };
}

function checkAll(options){
    if(options.value === 'checkAll'){
        options.$element.closest('form').find('input[type=checkbox]').prop("checked", true);
    }else if(options.value === 'uncheckAll'){
        options.$element.closest('form').find('input[type=checkbox]').prop("checked", false);
    }else{
        options.$element.closest('form').find('input[type=checkbox]').prop("checked", false);
    }
}

$(document).ready(function(){//Passive initializers
    if($('.message.flash').length){
        // If flash messages are presented, remove them after 3 seconds
        $('.message.flash').each(function(index){
            $(this).delay(9000).fadeOut(250).queue(function(){
                $(this).remove();
            });
        });
    }
});
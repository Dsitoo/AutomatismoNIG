/**
 * native.js provides some native class extensions and some DOM helper methods.
 * It will be loaded on every dynamic JSF page. Thus it defines some
 * additional functions which can be used on the page.
 */
 
// onLoadHandling

var loadFunctions = new Array();

/**
 * Adds a function which will be executed when a page is loaded.
 */
function addLoadFunction(func) {
	loadFunctions.push(func);
}
/**
 * Executes the load functions which should be called after loading the page is completed. 
 * This method will be called onload of every dynamic JSF page.<br>
 * On some pages the Silverlight plugin is used. 
 * The JavaScript onload event of the page should occur after the Silverlight plugin is completely loaded.
 * However in Internet Explorer this is not the case. 
 * Therefore we must synchronise the onload events of the page and the Silverlight plugin.
 * doLoad() will be called after the latest of the two events.
 */
function doLoad() {
	/* Check whether the page has been loaded and - if there is a Silverlight plugin on the page -
	   whether it has loaded already.
	   If not then do nothing. This method will be called again later. */
	var silverlightObject = document.getElementById("SilverlightPlugin");
	if (_pageLoaded && (!silverlightObject || silverlightObject.IsLoaded)) {
		// execute the loadFunctions
		//console.log("execute loadFunctions");
		for (var i=0; i<loadFunctions.length; i++) {
			var func = loadFunctions[i];
			try {
				if (typeof(func) == "string") {
					eval(func);
				} else {
					func();
				}
			} catch (ex) {
				var errorMsg = "Error in SIAS Client while executing:\n" + func;
				if (ex) {
					if (ex.name) {
						errorMsg += "\n" + ex.name;
					}
					if (ex.description) {
						errorMsg += "\n" + ex.description;
					}
					if (ex.message) {
						errorMsg += "\n" + ex.message;
					}
				}
				alert(errorMsg);
			}
		}
		loadFunctions = [];
	}
}

/** Method to be called on the onload event of the Silverlight plugin 
 * when the plugin is completely loaded. 
 * @private
 */
function _handlePluginLoaded(sender, args, source) {
	//console.log("Plugin loaded");
	doLoad();
}

/** Flag indicates whether the page completed loading.
 * @private
 */
var _pageLoaded = false;
/** Method to be called on the onload event of dynamic JSF page.
 * @private
 */
function _handlePageLoaded() {
	//console.log("Page loaded");
	_pageLoaded = true;
	doLoad();
}

// UnloadHandling

var unloadFunctions = new Array();
/**
 * Adds a function which will be executed when a page is unloaded.
 */
function addUnloadFunction(func) {
	unloadFunctions.push(func);
}
/**
 * Executes the unload functions. This method will be called onunload of
 * every dynamic JSF page.
 */
function doUnload() {
	while (unloadFunctions.length > 0) {
		var func = unloadFunctions.pop();
		try {
			if (typeof(func) == "string") {
				eval(func);
			} else {
				func();
			}
		} catch (ex) { alert(ex.message); }
	}
	
	//alert("doUnload executed");
}

/**
 * Native Class Extensions
 */
if (!Array.prototype.pop) {
	/**
	 * pops a element from a array
	 */
	Array.prototype.pop = function() {
		if (this.length > 0) {
			var element = this[this.length-1];
			this.length--;
			return element;
		} else {
			return null;
		}
	};
}

if (!Array.prototype.push) {
	/**
	 * pushs a element into an array
	 */
	Array.prototype.push = function(element) {
		this[this.length++] = element;
		return this.length;
	};
}

if (!Array.prototype.shift) {
	/**
	 * shifts an array
	 */
	Array.prototype.shift = function() {
		if (this.length > 0) {
			var element = this[0];
			var oldPosition = null;
			for (var e in this) {
				if (oldPosition != null) {
					this[oldPosition] = this[e];
					oldPosition = e;
				} else {
					oldPosition = e;
				}
			}
			this.length--;
			return element;
		} else {
			return null;
		}
	};
}

if (!Array.prototype.splice) {
	/**
	 * slices an array
	 */
	Array.prototype.splice = function(startIndex, amount) {
		var replacedElements = new Array();
		startIndex = Math.min(startIndex, this.length);
		for (i=0; i<amount; i++) {
			if (this.length > startIndex+i) {
				replacedElements.push(this[startIndex+i]);
			}
			this[startIndex+i] = arguments[2+i] || null;
		}
		return replacedElements;
	};
}

if (!Array.prototype.unshift) {
	/**
	 * unshifts an array
	 */
	Array.prototype.unshift = function() {
		var firstPart = new Array();
		for (i=0; i<arguments.length; i++) {
			firstPart.push(arguments[i]);
		}
		var firstPartLength = firstPart.length;
		for (i=this.length-1; i>=0; i--) {
			this[i+firstPartLength] = this[i];
		}
		for (i=0; i<firstPart.length; i++) {
			this[i]=firstPart[i];
		}
		return this.length;
	};
}
/**
 * checks if a string ends with another string
 */
String.prototype.endsWith = function(str) {
	if (this.length < str.length) return false;
	return this.substr(this.length-str.length,str.length)==str;
};
/**
 * compare function for String
 */
String.prototype.equals = function(str) {
	try { return this == str; } catch (ex) { return false; }
};
/**
 * compare function for Strings, ignoring case.
 */
String.prototype.equalsIgnoreCase = function(str) {
	try { return this.toLowerCase() == str.toLowerCase(); } catch (ex) { return false; }
};
/**
 * verifies if a string is in upper case
 */
String.prototype.isUpperCase = function(str) {
	if (!str) str = this;
	try { return str.toUpperCase() == str; } catch (ex) { return false; }
};
/**
 * verifies if a string is in lower case
 */
String.prototype.isLowerCase = function(str) {
	if (!str) str = this;
	try { return str.toLowerCase() == str; } catch (ex) { return false; }
};
/**
 * trims a string
 */
String.prototype.trim = function(str) {
	if (!str) str = this;
	while (str.length > 0 && (str.charAt(0)==' ' || str.charAt(0) == '\t')) str = str.substring(1);
	while (str.length > 0 && (str.charAt(str.length-1)==' ' || str.charAt(str.length-1) == '\t')) str = str.substring(0,str.length-2);
	return str;
};
/**
 * verifies if a string starts with another string
 */
String.prototype.startsWith = function(str) {
	if (this.length < str.length) return false;
	return this.substr(0,str.length)==str;
};
/**
 * returns ceil of a number
 */
Number.prototype.ceil = function() { return Math.ceil(this); };
/**
 * dotted number
 */
Number.prototype.dottedNumber = function(s,d) {
	var sp = s||".";
	var dt = d||",";
	var coda = this.postComma();
	var n = new String(this.floor());
	for (var pos=(n.indexOf(sp)>0?n.indexOf(sp):n.length)-3; pos>0; pos-=3) {
		n = n.substring(0,pos)+sp+n.substring(pos);
	}
	if (coda.length > 0) n+=dt+coda;
	return n;
};
/**
 * fix for Number
 */
Number.prototype.fix = function(digits) { return Math.round(this*Math.pow(10,digits))/Math.pow(10,digits); };
/**
 * floor for Number
 */
Number.prototype.floor = function() { return Math.floor(this); };
/**
 * returns the hex value of a number
 */
Number.prototype.getHexValue = function(l) {
	var run = this+0;
	var re = String();
	var hex = 1;
	while (run>0) {
		hex = run & 0xF;
		run = run >> 4;
		re = (hex < 10 ? hex : String.fromCharCode(55+hex)) + re;
	}
	if (l) re = Methods.leadZero(re,l);
	return re;
};
/**
 * fills a number with zeros in front
 */
Number.prototype.leadZero = function(l) {
	var re = new String(this);
	while (l > re.length) { re = "0"+re; }
	if (re.length==0) re = "0";
	return re;
};
/**
 * returns the maximum value of this and a number
 */
Number.prototype.max = function(num) { return Math.max(this,num); };
/**
 * returns the minimum value of this and a number
 */
Number.prototype.min = function(num) { return Math.min(this,num); };
/**
 * returns the number behind the comma
 */
Number.prototype.postComma = function() {
	var ts = new String(this);
	if (ts.indexOf(".") == -1) return "";
	return ts.substring(ts.indexOf(".")+1);
};
/**
 * returns the pow value
 */
Number.prototype.pow = function(num) { return Math.pow(this,num||0); };
/**
 * returns a random number based on this number
 */
Number.prototype.random = function() { return Math.random()*this; };
/**
 * rounds this number
 */
Number.prototype.round = function() { return Math.round(this); };
/**
 * returns the square root of this number
 */
Number.prototype.sqrt = function() { return Math.sqrt(this); };
/**
 * returns the square value of this number
 */
Number.prototype.square = function() { return this*this; };


//DOM helper methods

/**
 * creates a new layer
 */
function createLayer(className, tag, id) {
	tag = tag||"div";
	var lyr = document.createElement(tag);
	setClassNode(lyr,className);
	if (id && id != null) setAttributeNode(lyr,"id",id);
	return lyr;
}
/**
 * creates an image
 */
function createImage(className) {
	var lyr = createLayer(className,"img");
	return lyr;
}
/**
 * centers a div on its parent
 */
function centerOnParent(div,parent) {
	parent = parent||div.offsetParent;
	if (!parent) return;
	//das war mal clientHeight/Width statt offset...
	
	$(div).css({'top':parent.offsetHeight / 2 - div.clientHeight / 2,
	            'left':parent.offsetWidth / 2 - div.clientWidth / 2});
}
/**
 * moves to from
 */
function moveToFrom(div) {
	var max = 0;
	for (var i = 0; i < div.offsetParent.childNodes.length; i++) {
		max = Math.max(max,div.offsetParent.childNodes[i].zIndex);
	}
}

if ((document.createElement||null) == null) {
	/**
	 * creates a element
	 */
	document.createElement = function(elementName) {
		var elem = new Object();
		elem.tagName = elementName;
		return elem;
	};
}
/**
 * finds a child of a node by its id
 */
function findChildById(node, id) {
	var childs = node.childNodes;
	var child = null;
	for (var i=0; i < childs.length; i++) {			
			if (childs[i].id == id) { child = childs[i]; break; };
	}
	return child;
}
/**
 * sets the attribute of a node to a given value
 */
function setAttributeNode(node, attribName, attribValue) {
	if (!node || node == null) return;
	if (attribName == "class") eval(node).className = attribValue;
	else if (attribName == "id") eval(node).id = attribValue;
	else {
		alert(attribName); //Test if other attributes are used currently.
	}
}
/**
 * sets the class of a node
 */
function setClassNode(node, className) {
	setAttributeNode(node,"class",className);
}
/**
* remove a specific element or object from an array
*
* @param array	the array which should be changed
* @param index	the position of the element which should be removed
* @param id			the id of the element which should be removed
*/
function removeFromArray(array, index, id) {
	var which=(typeof(index)=="object")?index:array[index];
	if (id) {
		delete array[which.id];
  } else {
  	for (var i=0; i<array.length; i++) {
			if (array[i] == which) {
				if(array.splice) {
					array.splice(i,1);
				} else {
					for(var x=i; x<array.length-1; x++) array[x]=array[x+1];
	      	array.length -= 1;
	      }
				break;
			}
		}
	}
	return array;
}

/**
 * Provides a key map.
 */
KeyMap = function (id) {
    this.id = id;
	
	// holds the keys for this keymap
    this.keys = new Array();
	
	// holds the keyElements for this keymap
    this.elements = new Array();
	
	// holds the forminfos
    this.formId = "";
    this.formKeyFieldId = "";
    
    // holds kingsmoves id
    this.kingsmoveId = "";
    
    // holds global keymap
    this.globalKeymap = null;  
    
    //alert("new Keymap: " + id);
     
    // flag if a javascript action is eval for all events
    this.onAllEvents = false; 
    
    // holds the javascript action for all events
    this.onAllEventsAction = "";    
   
    root.registerObject(this);    
};
KeyMap.prototype = {
	/**
	 * adds a key to the keymap
	 */
	addKey:function (keyValue, keyElement) {
	    keyElement.setRootMap(this);
	    if (keyElement.isActive() == "true") {
	    	this.keys[keyValue] = keyElement.getId();
	    }
	    this.elements[keyElement.getId()] = keyElement;
	    //alert("keyElment: " + keyElement.action + "\nkeyMap: " + this.id);
	},
	/**
	 * sets a key
	 */
	setKey:function(keyCode,keyElementId) {
		this.keys[keyCode] = keyElementId;
	},
	/**
	 * returns a key element by a elementId
	 */
	getElement:function (elementId) {
	    return this.elements[elementId];
	}, 
	/**
	 * sets the form to submit the keyMap data
	 */
	setForm:function (myFormId, myFormKeyFieldId) {
	    this.formId = myFormId;
	    this.formKeyFieldId = myFormKeyFieldId;
	}, 
	/**
	 * sets the kingsMoveId 
	 */
	setKingsMoveId:function(kingsmoveId) {
		this.kingsmoveId = kingsmoveId;
	},
	/**
	 * returns the kingsMoveId
	 */
	getKingsMoveId:function() {
		return this.kingsmoveId;
	},
	/**
	 * sets the flag for onAllEvents
	 */
	setOnAllEvents:function(onAllEvents) {
		this.onAllEvents = onAllEvents;
	},
	/**
	 * returns the flag for onAllEvents
	 */
	getOnAllEvents:function() {
		return this.onAllEvents;
	},
	/**
	 * sets the action to be evaluated if the onAllEvents-flag is set.
	 */
	setOnAllEventsAction:function(onAllEventsAction) {
		this.onAllEventsAction = onAllEventsAction;
	},
	/**
	 * Handles the keyUp action
	 */
	handelKeyUpEvent:function(evnt) {
		evnt = evnt || window.event;
		keycode = getKeyCode(evnt);
   	if (this.onAllEvents && !root.isBlocked()) {
	  		eval(this.onAllEventsAction);
		}
		// moved to root.js
		//if (keycode == 16) {
		//	root.unsetShift();
		//}
	},
	/**
	 * Handles the keyPress action
	 */
	handelKeyPressEvent:function(evnt) {
		evnt = evnt || window.event;
		keycode = getKeyCode(evnt);
   	if (this.onAllEvents && !root.isBlocked()) {
	  		eval(this.onAllEventsAction);
		}
		// moved to root.js
		//if (keycode == 16) {
		//	root.unsetShift();
		//}
	},
	/**
	 * Handles the keyDown event
	 */
	handelKeyDownEvent:function (evnt) {
	    evnt = evnt || window.event;
	   	keycode = getKeyCode(evnt);
	   	if (this.onAllEvents && !root.isBlocked()) {
	   		eval(this.onAllEventsAction);
	   	} else if (!root.blockKey) {
	    	// moved to root.js
	    	//if (keycode == 16) {
	    	//	root.setShift();
	    	//} 
	    	if (keycode < 16 || keycode > 18) {	    	
		        var key = "";
		        key += evnt.altKey ? "1" : "0";
		        key += evnt.ctrlKey ? "1" : "0";
		        key += evnt.shiftKey ? "1" : "0";
		        key += keycode;	         	
		        this.globalKeymap = root.getObject('globalKeymap');	  
		        //alert("id:" + this.id + "\nglobal: " +this.globalKeymap.keys[key]+"\nlocal: "+this.keys[key]+"\nkey: "+key);      
		        if (this.globalKeymap.keys[key] != null) {	        	 	        	
		        	if (this.globalKeymap.elements[this.globalKeymap.keys[key]].getAction().substr(0, 1) == "#") {
		        		root.unsetShift();
		        		document.forms[this.globalKeymap.formId].elements[this.globalKeymap.formKeyFieldId].value = key;
		                document.forms[this.globalKeymap.formId].elements["submit"].click();	                
		            } else {
		                try {	                	    
		                	eval(this.globalKeymap.elements[this.globalKeymap.keys[key]].getAction());	 		                	               	
		                }
		                catch (ex) {	                                	
		                }
		            }
		        } else if (this.keys[key] != null) {	               	
		        	if (this.elements[this.keys[key]].getAction().substr(0, 1) == "#") {
		                document.forms[this.formId].elements[this.formKeyFieldId].value = key;
		                document.forms[this.formId].elements["submit"].click();
		            } else {
		                try {
		                	eval(this.elements[this.keys[key]].getAction());
		                }
		                catch (ex) {	                	
		                }
		            }	            
		        } else {
		            try {	            	
		                parent.onkeydown(evnt);
		            }
		            catch (excp) {
		            }
		        }		        
		    }		    
		}		
	}
};
/**
 * a key element
 */
KeyElement = function (id, keyCode, action, active) {
    this.id = id;
    this.active = active;
    this.action = action;
    this.keyCode = keyCode;
    this.rootMap = null;
    //alert("id: "+id+"\nkeyCode: "+keyCode+"\naction: "+action+"\nactive: "+active);
};
KeyElement.prototype = {
	/**
	 * returns the id of a keyelement
	 */
	getId:function () {
	    return this.id;
	}, 
	/**
	 * sets a keyelement active
	 */
	setActive:function (active) {
		this.active = active;
	    if (this.active == "true") {
	    	this.rootMap.setKey(this.keyCode,this.id);
	    }
	    
	}, 
	
	isActive:function () {
	    return this.active;
	}, 
	
	setAction:function (action) {
	    this.action = action;
	}, 
	
	getAction:function () {
	    return this.action;
	}, 
	
	setRootMap:function (map){
		this.rootMap = map;
	}
};

var keymap = null;
var globalKeymap = root.getObject("globalKeymap");
if(typeof(globalKeymap) == 'undefined'){
	globalKeymap = new KeyMap("globalKeymap");
}


/**
 * The map.js is the main map JavaScript. It provides a map with different layers,
 * data of the map (like centre etc.), mouse and keyboard event handling and manages all map tools.
 */

/** Holds the maps.<br> 
* @deprecated Do not use the maps array. It will be made private at the next release. 
* Instead call the static method Map.getMap(clientId) to get the Map object for the given Id.
 */
var maps = new Array();
/* The global flag "mouseDown" indicates whether the left mouse button currently is pressed.
   Only if mouseDown then the MouseMove event is processed. */ 
var mouseDown = false;
/** Position of last MouseDown event */
var startPoint = new DynPoint(0, 0);
/** Last mouse position */
var lastPoint = new DynPoint(0, 0);

/*============== Map ========================================================*/
/**
 * Constructor for the main map object.
 * @constructor
 */
Map = function (clientId) {
    this.id = clientId;
    // graphics layers
    this.silverlightContent = null; // content sub-object of the Silverlight plug-in 
    this.contentRoot = null; // root of the XAML document
    this.layer = null; // FullspaceDiv layer
    this.panLayer = null;
    this.mapLayer = null;
    this.imageLayers = new Array();
    this.mapTiles = new Array();
    this.toolsLayer = null;
    this.kingsmoves = null;
    this.dragLayer = null;
	// info parameters
	this.centre = new DynPoint(0,0);
	this.rotation = 0.0;
	this.viewScale = 0.0;
	this.world = "";
   this.crs = "";
	this.unit = null;
	this.observer = new Array();
	this.transform = null;
	this.blocker = null;
	
	// Properties for handling of custom cursors
	
	// Coordinates of the cursor hotspot. That is the pixel of the cursor that the user
	// perceives as actually "doing the work". Our cursor designs sometimes have
	// the hotspot in the middle (cross-hair), sometimes at the top-left (selection arrow).
	this.hotspot = new DynPoint(0,0);
	// Current position of mouse over the map. 
	// We must constantly update the cursorPosition so that it is available on the call of setCursor.
	// (-1,-1) denotes that the mouse currently is not placed over the map.
	this.cursorPosition = new DynPoint(-1,-1);
};
Map.prototype = {
	imageLayers:null,
	dragLayer:null,
	loadingMap:false,
	activeTool:null,
	hasKingsmoves:false,
	activeLayer:null,
	activeTiles:null,
	
	/**
	 * Creates the graphic layers needed by the map and the map tools.
	 * Attaches the event listeners.
	 * The layers are created as Silverlight objects.
     * @param clientId the id of the map
	 */
	createMapLayers: function (clientId) {
		// Register this to be blocked when a modal window is displayed
		root.addObjectToBlock(this);
		
	    this.silverlightContent = document.getElementById("SilverlightPlugin").content;
	    this.contentRoot = this.silverlightContent.FindName("content_root");

	    // Add callbacks for the silverlight key events.
	    // extra logic to check the Silverlight Plugin is there. In the test harness his isn't the case.
	    try{
	    	var slApp = this.silverlightContent.silverlightApp;
	    	slApp.silverlightKeyDownEvent = handleSilverlightKeyDownEvent;
	    	slApp.silverlightKeyUpEvent = handleSilverlightKeyUpEvent;
	    }
	    catch (err){
	    }
	    
		// Create the panLayer
		var xamlFragment = "<Canvas Name='panLayer' Tag='" + clientId + "'/>";
		this.panLayer = this.silverlightContent.createFromXaml(xamlFragment, false);
		this.contentRoot.Children.Add(this.panLayer);

		// Create the mapLayer
		xamlFragment = "<Canvas Name='mapLayer' Tag='" + clientId + "'/>";
		this.mapLayer = this.silverlightContent.createFromXaml(xamlFragment, false);
		this.panLayer.Children.Add(this.mapLayer);

		// Create the tools layer, where the tools will be placed, for example the overview frame or the plot boxes.
		// We use the attribute Background='Transparent' so that we can look through the toolsLayer
		// onto the map but still have the toolsLayer hit-tested. The alternative Opacity='0' does 
		// not work because then the map tools and custom cursors also have Opacity=0 and are invisible.
		// For test purposes you can use the attributes Background='yellow' Opacity='0.3' to color 
		// the canvas and make it visible.
		xamlFragment = "<Canvas Name='tools' Tag='" + clientId + "' Background='Transparent'/>";
		this.toolsLayer = this.silverlightContent.createFromXaml(xamlFragment, false);
		this.panLayer.Children.Add(this.toolsLayer);
		// Add event listeners
	    this.toolsLayer.addEventListener("MouseLeftButtonDown", handleMapMouseDown);
	      //this.toolsLayer.addEventListener("MouseLeftButtonUp", handleMapMouseUp);
	      //this.toolsLayer.addEventListener("MouseMove", handleMapMouseMove);
	    // Event handling for display of custom mouse cursors. 
	    // Not effective on Chrome and Safari on Mac.
	    if (!_Chrome() && ! ($.browser.safari && _platformMac()) ) {
		    this.toolsLayer.addEventListener("MouseEnter", handleMouseCursorShow);
		    this.toolsLayer.addEventListener("MouseMove", handleMouseCursorShow);
		    this.toolsLayer.addEventListener("MouseLeave", handleMouseCursorHide);
				}

		// Create the kings moves layer
		if (this.hasKingsmoves) {
			xamlFragment = "<Canvas Name='kingsmoves" + clientId + "'/>";
			this.kingsmoves = this.silverlightContent.createFromXaml(xamlFragment, false);
			this.contentRoot.Children.Add(this.kingsmoves);
			}

		// Create the draglayer (previously also called eventlayer)
		// For test purposes you can color the layer using the properties Fill='Red' Opacity='0.5'
		xamlFragment = "<Rectangle Name='dragLayer' Tag='" + clientId + "' Fill='Transparent' />";
	    this.dragLayer = this.silverlightContent.createFromXaml(xamlFragment, false);
		this.contentRoot.Children.Add(this.dragLayer);
		// Add event listeners
	    this.dragLayer.addEventListener("MouseLeftButtonDown", handleMapMouseDown);
	    this.dragLayer.addEventListener("MouseLeftButtonUp", handleMapMouseUp);
	    this.dragLayer.addEventListener("MouseMove", handleMapMouseMove);
	    // De-activated the handling of "MouseLeave" event because of issue CBG00134049
	    //  to allow to continue actions of a map tool after the mouse pointer left and re-entered the map.
	    //  this.dragLayer.addEventListener("MouseLeave", handleMapMouseOut);
	    // Event handling for display of custom mouse cursors. 
	    // Not effective on Chrome and Safari on Mac.
	    if (!_Chrome() && ! ($.browser.safari && _platformMac()) ) {
		    this.dragLayer.addEventListener("MouseEnter", handleMouseCursorShow);
		    this.dragLayer.addEventListener("MouseMove", handleMouseCursorShow);
		    this.dragLayer.addEventListener("MouseLeave", handleMouseCursorHide);
		}

		// Create the block layer. Used for example when a modal window opens and wants to block the rest.
		xamlFragment = "<Rectangle Name='blocker" + clientId + "' Fill='Transparent' />";
		this.blockLayer = this.silverlightContent.createFromXaml(xamlFragment, false);
		this.contentRoot.Children.Add(this.blockLayer);
		// Add event listeners
	    this.blockLayer.addEventListener("MouseLeftButtonDown", blockMap);
	    this.blockLayer.addEventListener("MouseLeftButtonUp", blockMap);
	    this.blockLayer.addEventListener("MouseMove", blockMap);
	    this.blockLayer.addEventListener("MouseLeave", blockMap);

	    this.setCaptureEvents(false);
	},
	/**
	 * Activates a tool. Should be called by the tool that currently was 
	 * switched to active. If there is an active tool already it will be 
	 * deactivated by calling the deactivate method.
	 * @param the active tool (object)
	 */	
	activateTool:function (tool) {
	    if (tool != null && this.activeTool != tool) {
	        if (this.activeTool != null && this.activeTool.deactivate) {
	            this.activeTool.deactivate(this.id);
	        }
	        this.activeTool = tool;
	        if (tool.activate) {
	            tool.activate(this.id);
	        }
	    }
	},
	
	/**
	 * Registers an observer. Each observer gets informed when the map has changed.
	 * @param the observer 
	 */
	addObserver : function(obs) {
		var i;
		if (obs != null) {
			for (i = 0; i < this.observer.length; i++) {
				if (this.observer[i] == obs) {
					return;
	       }
	   }
			this.observer.push(obs);
	   }
	},
	/**
	 * Informs all registered observers about the changed map.
	 */
	callObserver : function() {
		var i;
		for (i = 0; i < this.observer.length; i++) {
			curObserver = this.observer[i];
			if (curObserver.mapChanged) {
				curObserver.mapChanged(this);
			}
		}
	},
	
	/**
	 * Begins to set the map tiles. Has to be followed by a call of endSettingMapTiles().
	 * Prepares the map for setting new map tiles. Will only be used by the map tag.
	 * @ignore
	 */
	beginSettingMapTiles: function (layerIndex) {
	    if (!this.loadingMap) {
	        this.loadingMap = true;
	        root.setClientBlocker();
	        
		    var contentRoot = this.silverlightContent.FindName("content_root");
		    contentRoot.Width = this.layer.offsetWidth;
		    contentRoot.Height = this.layer.offsetHeight;
		    
	        this.resetPosDim(this.mapLayer);
	     }
	    if (this.mapTiles[layerIndex] == null) {
	        this.mapTiles[layerIndex] = new Array();
	        
		    var imageLayer = this.silverlightContent.createFromXaml("<Canvas/>", false);
		    this.mapLayer.Children.Add(imageLayer);
	        
	        this.imageLayers[layerIndex] = imageLayer;
		     }
	    this.activeTiles = this.mapTiles[layerIndex];
	    this.activeLayer = this.imageLayers[layerIndex];
	    
	    this.resetPosDim(this.activeLayer);
		var i;
	    for (i = 0; i < this.activeTiles.length; i++) {
	        this.activeTiles[i].justSet = false;
		}
	},
	/**
	 * Finishes the setting of the map tiles started by beginSettingMapTiles().
	 * Only used by the map tag.
	 * @ignore
	 */
	endSettingMapTiles:function (layerIndex) {
		var i;
		for (layerIndex = 0; layerIndex < this.mapTiles.length; layerIndex++) {
	    	activeLayer = this.mapTiles[layerIndex];
		    for (i = 0; i < activeLayer.length; i++) {
		        tile = activeLayer[i];
		        if (tile.justSet) {
		            tile.show();
		        } else {
		            tile.hide();
		        }
		    }
	    }
	},
	/**
	 * Sets map tiles. Only used by the map tag.
	 * @ignore
	 */
	setMapTile:function (xPos, yPos, width, height, url, transparent) {
		var i;
	    for (i = 0; i < this.activeTiles.length; i++) {
	        tile = this.activeTiles[i];
	        if (tile.url == url) {
	            tile.setX(xPos);
	            tile.setY(yPos);
	            tile.setWidth(width);
	            tile.setHeight(height);
	            tile.justSet = true;
	            return;
	        }
	    }
	    tile = new MapTile(this.activeLayer, transparent);
	    this.activeTiles.push(tile);
	    tile.setX(xPos);
	    tile.setY(yPos);
        tile.setWidth(width);
        tile.setHeight(height);
	    tile.setUrl(url);
	},
	/**
	 * Clears the map tiles. Only used by the map tag.
	 * @ignore
	 */
	clearMapTiles: function() {
		var i;
		for(i=0; i<this.mapTiles.length; i++) {
	    	var aTiles = this.mapTiles[i];
		    while (aTiles.length > 0) {
		    	var tile = aTiles.pop();
		        tile.clear(this.imageLayers[i]);
		        delete tile;
		    }
		}
	},

	/**
	 * Executes follow-up activities after a map has changed and is loaded. 
	 * Only used by the tag.
	 * @ignore
	 */
	checkMapComplete: function () {
		// reset the map's layers to the upper left corner
	    this.resetPosDim(this.mapLayer);
	    this.resetPosDim(this.toolsLayer);
	    this.resetPosDim(this.panLayer);
	    var j;
	    for (j = 0; j < this.imageLayers.length; j++) {
	        this.activeLayer = this.imageLayers[j];
	    	this.resetPosDim(this.activeLayer);
	    }
	    if (this.hasKingsmoves) {
	        refreshKingsMoveArrows(this.id);
	    }
	    if (this.sketchWrapper) {
	    	this.resetPosDim(this.sketchWrapper);
	    }
	    this.loadingMap = false;
	    
	    // Ensure that a custom cursor is placed correctly.
	    // If a custom cursor style is set then the image which represents the cursor must 
		// be placed at the current mouse position.
	    // This is important after panning: the pan layer is repositioned 
	    // and the custom cursor is at a wrong place. Issue CBG00144624 for Firefox.
		var cursor = this.silverlightContent.FindName("CustomMapCursor");
		if (cursor &&
			cursor.visibility == "Visible" &&
			this.cursorPosition.x >= 0 && this.cursorPosition.y >= 0 ) {
			cursor["Canvas.Left"] = this.cursorPosition.x - this.hotspot.x;
			cursor["Canvas.Top"]  = this.cursorPosition.y - this.hotspot.y;
	    	// Switch the built in cursor off
	    	this.toolsLayer.Cursor = "None";
		}

	    root.releaseClientBlocker();
	},

	/** Reset position and dimension of a layer. 
	 * @param layer a Silverlight canvas
	 * @ignore
	 */
	resetPosDim: function (layer) {
		if(layer != null && this.layer != null){
			//console.log("resetPosDim " + layer.Name +","+ this.layer.offsetLeft +","+ this.layer.offsetTop +","+ this.layer.offsetWidth +","+ this.layer.offsetHeight);
			layer["Canvas.Left"] = this.layer.offsetLeft;
		    layer["Canvas.Top"]  = this.layer.offsetTop;
		    layer.Width  = this.layer.offsetWidth;
		    layer.Height = this.layer.offsetHeight;
	    }
	},

	/**
	 * Performs a kings move on the map in the given direction.
	 * This method will only be used by the kings moves on the map.
 	 * @param mouseButtonEventArgs event data from Silverlight which describes the event
	 * @ignore
	 */
	doKingsMove: function (clientId, direction, mouseButtonEventArgs) {
	    if (root.isBlocked()) {
	        return false;
	    }
		root.setServerBlocker();		
		var shift = false;
	    if (mouseButtonEventArgs) {
	        shift = mouseButtonEventArgs.Shift;
		} else {
			shift = root.shift;
		}
	    document.getElementById(clientId + "direction").value = direction;
	    if (shift) {    	
	    	document.getElementById(clientId + "range").value = "75%";    	
	    } else {
	    	document.getElementById(clientId + "range").value = "50%";
	    }
	    root.unsetShift();
    	document.getElementById("formKingsMove" + clientId).submit();
	    return false;
	},

	// =============== Event handling ========================
	
	/**
	 * Enables or disables the event layer.
	 * @param {boolean} enable boolean which indicates whether the event layer is to be enabled.
	 */
	enableEventLayer: function (enable) {
	    if (enable) {
			if(this.layer != null){
				// Maximise width and height of the layer in order to activate it
			    this.dragLayer.Width  = this.layer.offsetWidth;
			    this.dragLayer.Height = this.layer.offsetHeight;
		    }
	    } else {
			// Minimise width and height of the layer in order to deactivate it
	        this.dragLayer.Width = 0;
	        this.dragLayer.Height = 0;
	    }
	},
	/**
	 * Some tools need the event layer and they should call this method with capture=true
	 * so that the eventLayer will stay active.
	 * @param {boolean} capture a boolean which indicates whether the eventLayer should stay active.
	 */
	setCaptureEvents: function(capture) {
		this.captureEvents = capture;
		this.enableEventLayer(capture);
	},

	/**
	 * Forwards a mousedown event to the active tool. 
	 */
	// This method is not used in the client.
	handleMouseDown: function(evnt) {
	    handleMapMouseDown(evnt, this.id);
	},
	
	/**
	 * Forward a mousemove event to the active tool. 
	 */
	// This method is not used in the client.
	handleMouseMove: function(evnt) {
	    handleMapMouseMove(evnt, this.id);
	},
	
	/**
	 * Forward a mouseup event to the active tool. 
	 */
	// This method is not used in the client.
	handleMouseUp: function(evnt) {
	    handleMapMouseUp(evnt, this.id);
	},
	
	unload: function() {
		root.removeObjectToBlock(this);
	},
	
	/** Blocks the map. This is done by activating and maximising the blocklayer.
	 * This method block(block, blocker) will be called when 
	 * a modal window is opened and wants to block other objects.
	 * It will be called because the map registered for object blocking when calling addObjectToBlock().
	 * @param block boolean which indicates whether to block or unblock
     * @param blocker the object (normally a modal window) which causes un/blocking of other objects.
	 */
	block: function(block, blocker) {
		// Only change the blocklayer when the map is visible,
		//  i.e. its FullspaceDiv layer is visible
		if (this.layer != null &&
				this.layer.style.display != "none" &&
				this.layer.style.visibilty == "visible") {
			this.blocker = blocker;
			if (block) {
				// Maximise width and height of the blockLayer in order to activate it
			    this.blockLayer.Width  = this.layer.offsetWidth;
			    this.blockLayer.Height = this.layer.offsetHeight;
		    } else {
		        this.blockLayer.Width = 0;
		        this.blockLayer.Height = 0;
		    }
		}
	},
	
	/**
	 * Sets the mouse cursor. This can be called by map tools to define which mouse cursor
	 * should appear on the map. 
	 * Silverlight has only very few mouse cursor styles built in. To implement custom cursors 
	 * we handle the MouseMove event and move a custom image by 
	 * setting it's position to the current X/Y coordinates of the mouse. 
	 * The functions handleMouseCursorShow and handleMouseCursorHide update the position and
	 * make the cursor image visible and invisible.<br>
	 * Because the browser Chrome has a bug regarding cursors and Silverlight, this method 
	 * has no effect on Chrome. 
	 * Furthermore on Safari on Mac this method is not effective.
	 *  
	 * @param {String} type the mouse cursor style. This can be an identifier for the standard cursors
	 * which Silverlight supports: Arrow, Hand, Wait, SizeNS, SizeWE, IBeam, Stylus, Eraser, Default, None.
	 * Or it can be the file name of an image in the PNG or JPEG file formats. Example: cursor_crosshair.png . 
	 * This file name is prepended with a cursorPath which is: 
	 *  /<web application name>/modules/map/themes/xp/
	 * @param {int} hotspotX x coordinate of the cursor hotspot. 
	 *		Will be ignored for the standard built in cursors.
	 *		Optional parameter. Default is 0.
	 *		The hotspot is the pixel of the cursor that the user perceives as actually "doing the work". 
	 *		Our cursor designs sometimes have the hotspot in the middle (cross-hair), sometimes at the top-left (selection arrow).
	 * @param {int} hotspotY y coordinate of the cursor hotspot. 
	 *		Optional parameter. Default is 0.
	 */
	setCursor: function(type, hotspotX, hotspotY) {
		if (type && !_Chrome() && ! ($.browser.safari && _platformMac())) {
			var cursorHolder = this.toolsLayer;
	    	// Remove old image which represented the mouse cursor
			var cursor = cursorHolder.FindName("CustomMapCursor");
	    	if (cursor) {
	    		cursorHolder.Children.Remove(cursor);
	    	}
			if (Map.isStandardCursor(type)) {
				// Set one of the built in cursor types
		    	cursorHolder.Cursor = type;
		    } else {

		    	// Define the hotspot position of the custom cursor 
		    	if (!hotspotX || !hotspotY) {
                    //Get hotspot positions centrally defined in "cursorConfig.js"
                    var hotspot = cursorMap[type];
                    if(hotspot) {
                        hotspotX = parseInt(hotspot[0]);
                        hotspotY = parseInt(hotspot[1]);
                    } else {
                        hotspotX = 0;
                        hotspotY = 0;
                    }
		    	}
                this.hotspot = new DynPoint(hotspotX, hotspotY);

		    	// Switch the built in cursor off
		    	cursorHolder.Cursor = "None";
		    	// Decide whether the new cursor image can be visible immediately
		    	var visibility = (this.cursorPosition.x >= 0 && this.cursorPosition.y >= 0) ? "Visible" : "Collapsed";
		    	// Set an image which represents the mouse cursor
		    	var cursorImage = root.getURL() + "/modules/map/themes/xp/" + type;
				var xamlFragment = "<Image Source='" + cursorImage + "'  Name='CustomMapCursor' Visibility='" + visibility + "' Canvas.ZIndex='100' IsHitTestVisible='false'/>";
				cursor = this.silverlightContent.createFromXaml(xamlFragment, false);
		    	cursorHolder.Children.Add(cursor);
		    	// Set the position of the cursor image if mouse position is over the map
		    	if (this.cursorPosition.x >= 0 && this.cursorPosition.y >= 0 ) {
					// Check whether the panLayer has been moved (because the user pans the map).
					// In that case: the mouse is re-positioned relative to the top left corner of the panLayer.
					// We subtract the movement of the panLayer to result in positioning the mouse relative to 
					// top left corner of content_root.
			    	//  Get moved distance:
					var movedX = this.panLayer["Canvas.Left"];
					var movedY = this.panLayer["Canvas.Top"];
					cursor["Canvas.Left"] = this.cursorPosition.x - this.hotspot.x - movedX;
					cursor["Canvas.Top"]  = this.cursorPosition.y - this.hotspot.y - movedY;
				}
		    }
		    // Set type of cursor (none or built in) also to the dragLayer
		    this.dragLayer.Cursor = cursorHolder.Cursor;
	    }
	},
	
	/**
	 * Submits the parameters for the tool with the given name. Uses a hidden form in the map page.
	 * @param toolname the identifier for the tool (for example "selection").
	 * @param parameters a JavaScript object which contains the parameters which should be submitted:
	 *		{name1: value1, name2: value2,...}
	 */
	submit : function( toolname, parameters ) {
		if (parameters) {
			root.setServerBlocker();
			var propertyname;
			var paramvalue;
			var inputfield;
			for (propertyname in parameters) {
				paramvalue = parameters[propertyname];
				inputfield = document.getElementById( toolname + this.id + propertyname );
				if (inputfield) {
					inputfield.value = paramvalue;
				}
			}
			// Submit the form 
			var form = document.getElementById( toolname + "Form" + this.id);
			//form = $("#" + toolname + "Form" + this.id.replace(/:/g,"\\:"));
			if (form) {
				form.submit();
			}
		}
	},
	
	// ============= getters and setters for info parameters ================
	
	/**
	 * Returns the centre of the current map.
	 * @return the centre as a DynPoint 
	 */
	getCentre:function() {
		return this.centre;
	},
	/**
	 * Returns this centre for a given unit.
	 * @return the centre as a DynPoint 
 	 */
	getCentreForUnit:function(unit) {
		if(unit != this.unit && this.unit != "degree"){
			return unitConvertPoint(this.centre, this.unit, unit);
		} else {
			return this.centre;
		}
	},
	/**
	 * Sets a centre, should only be used by the map tag.
	 * @ignore
	 */
	setCentre:function(x, y) {
		this.centre.moveTo(x, y);
		this.setTransform();
	},
	/**
	 * Returns the current rotation.
	 * @return rotation as a double 
	 */
	getRotation:function() {
		return this.rotation;
	},
	/**
	 * Sets a rotation. Should only be used by the map tag.
	 * @ignore
	 */
	setRotation:function(rotation) {
		this.rotation = rotation;
		this.setTransform();
	},
	/**
	 * Returns this view scale of the map.
	 * @return view scale as a double
	 */
	getViewScale:function() {
		return this.viewScale * 0.26;
	},
	/**
	 * Sets a view scale. Should only be used by the map tag.
	 * @ignore
	 */
	setViewScale:function(viewScale) {
		this.viewScale = viewScale;
		this.setTransform();
	},
	/**
	 * Returns the current world.
	 * @return world urn as string
	 */
	getWorld:function() {
		return this.world;
	},
	/**
	 * Sets the current world. Should only be used by the map tag.
	 * @ignore
	 */
	setWorld:function(world) {
		this.world = world;
	},
    /**
     * Returns the current CRS.
     * @return CRS as string
     */
    getCrs:function() {
        return this.crs;
    },
    /**
     * Sets the current CRS. Should only be used by the map tag.
     * @ignore
     */
    setCrs:function(crs) {
        this.crs = crs;
    },
	/**
	 * Returns the current unit of the map.
	 * @return unit identifier 
	 */
	getUnit:function() {
		return this.unit;
	},
	/**
	 * Sets the unit. Should only be used by the map tag.
	 * @ignore
	 */
	setUnit:function(unit) {
		this.unit = unit;
		this.setTransform();
	},
	/**
	 * Returns the width of the map.
	 */
	getWidth:function() {
		return this.layer.offsetWidth;
	},
	/**
	 * Returns the height of the map.
	 */
	getHeight:function() {
		return this.layer.offsetHeight;	
	},
	/**
	 * Returns the size of the map
	 * @return size as a DynPoint(width, height)
	 */
	getSize:function() {
		return new DynPoint(this.layer.offsetWidth, this.layer.offsetHeight);
	},
	/**
	 * Returns the unit factor of the given unit.
	 * @return unitFactor 
	 */ 
	getUnitFactor:function(unit) {
		if (this.unit == "degree") {
			return AffineTransform.getUnit("degree").factor	/ AffineTransform.getUnitFactor(unit);
		} else {
			return 1.0;
		}
	}, 
	/**
	* Returns the short name of the unit.
	* @return representation of the unit.
	*/ 
	getUnitName:function(unit) {
		return AffineTransform.getUnit(unit).short;
	},
	/**
	 * Sets the transform for the current map data. Should be called without parameter 
	 */
	setTransform : function() {
		this.transform = AffineTransform.newPixelToCS(this.getSize(), 
			this.getViewScale(), this.centre,
			this.rotation, this.unit);
	},
	/**
	 * Returns the transform matrix for the current map data.
	 */
	getTransform : function() {
	 	return this.transform;
	},
	/**
	 * Returns the real world coordinate of the given pixel coordinate. 
	 */		 
	getCoordinate : function(pixel) {
	 	return this.transform.transformPoint(pixel);
	}, 
	/** Returns AffineTransform.newPixelToCS using the current map parameters and the given unit. */
	getTransformForUnit : function(unit) {
		return AffineTransform.newPixelToCS(this.getSize(), 
			this.getViewScale(), this.getCentreForUnit(unit),
			this.getRotation(), unit);
	}
};

	/**
 * Static function which returns the Map object with the given id.
 * @param clientId the id of the map
 * @return	the Map object for the given id
 */
Map.getMap = function(clientId) {
	if (maps && clientId) {
		return maps[clientId];
	} else {
		return null;
	}
};
/**
 * Static helper function which indicates whether the given mouse cursor style 
 * is standard and built in by Silverlight. 
 * The standard cursors which Silverlight supports are: 
 * Arrow, Hand, Wait, SizeNS, SizeWE, IBeam, Stylus, Eraser.
 * @param {String} type the mouse cursor style to check.
 * @return true if the type is a built in type
 * @type Boolean
 */
Map.isStandardCursor = function(type) {
	return (type == "Arrow" || type == "Hand" || type == "Wait" || type == "SizeNS" || type == "SizeWE" || type == "IBeam" || type == "Stylus" || type == "Eraser" || type == "Default" || type == "None");
};


/*============== Event Handling ======================================================*/
/**
 * Handles the mouseDown event on a map. Called by Silverlight. Initialises any map 
 * interaction. The dragLayer will be used to block the map for other input
 * and captures all following input. The position of the event is calculated 
 * and the active tool's handleMouseDown method is called.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseButtonEventArgs event data from Silverlight which describes the event
 */
function handleMapMouseDown(sender, mouseButtonEventArgs) {
	//console.log("handleMapMouseDown " + sender.Name + " Source: " + mouseButtonEventArgs.Source.Name );
    if (root.isBlocked()) {
        return false;
    }
	var clientId = getIdFromLayer(sender);
    var map = maps[clientId];
    if(!map.captureEvents){
	   map.enableEventLayer(true);
    }
    if (map != null && map.activeTool != null) {
        root.stamp = (new Date()).getTime();
        mouseDown = true;
        var posX = mouseButtonEventArgs.GetPosition(null).X;
        var posY = mouseButtonEventArgs.GetPosition(null).Y;
        startPoint.moveTo(posX, posY);
        lastPoint.moveTo(startPoint);
/*		 if(map.blocked == true){
		 	return false;
		 }*/
        map.activeTool.handleMouseDown(clientId, lastPoint, mouseButtonEventArgs);
    }
    mouseButtonEventArgs.Handled = true;
    return false;
}

	/**
 * Handles the mouseMove event on a map. Called by Silverlight. 
 * The position of the event is retrieved
 * and the handleMouseMove method of the active tool is called.
 * For performance reasons, not all mouseMove events are handled.
 * When a MouseMove event has been handled then for all MouseMove events 
 * within the next milliseconds given by root.minWait no action is performed on the MouseMove event.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseEventArgs event data from Silverlight which describes the event
	 */
function handleMapMouseMove(sender, mouseEventArgs) {
	var clientId = getIdFromLayer(sender);
    var map = maps[clientId];
    if (root.isBlocked() || map.blocked == true) {
        return false;
    }
    if ((new Date()).getTime() - root.stamp <= root.minWait) {
        return false;
    }
    //console.log("handleMapMouseMove " + sender.Name);

    root.stamp = (new Date()).getTime();
    
	var posX = mouseEventArgs.GetPosition(null).X;
	var posY = mouseEventArgs.GetPosition(null).Y;
	
    if(map.activeTool != null){
	    if (mouseDown || map.activeTool.getAllMoves) {
			  try { 
			  	lastPoint.moveTo(posX, posY);
			  } catch(e){};
	          map.activeTool.handleMouseMove(clientId, lastPoint, mouseEventArgs);
		}
	 }
    return false;
}

	/**
 * Handles the mouseUp event on a map. Called by Silverlight. The dragLayer is deactivated,
 * the position of the event is calculated and the active tool's
 * handleMouseUp method is called.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseButtonEventArgs event data from Silverlight which describes the event
	 */
function handleMapMouseUp(sender, mouseButtonEventArgs) {
	//console.log("handleMapMouseUp " + sender.Name + " Source: " + mouseButtonEventArgs.Source.Name );
	var clientId = getIdFromLayer(sender);
    var map = maps[clientId];
    if (root.isBlocked() || map.blocked == true) {
        return false;
    }
    if(!map.captureEvents){
	    map.enableEventLayer(false);
    }
    if (mouseDown && map.activeTool != null) {
        var posX = mouseButtonEventArgs.GetPosition(null).X;
        var posY = mouseButtonEventArgs.GetPosition(null).Y;
        lastPoint.moveTo(posX, posY);
        map.activeTool.handleMouseUp(clientId, lastPoint, mouseButtonEventArgs);
    }
    mouseDown = false;
    mouseButtonEventArgs.Handled = true;
    return false;
	    }

	/**
 * Handles the mouseOut event on a map. Called by Silverlight. The mouse has left the map.
 * Should be nearly the same like handleMouseUp, but the last known 
 * point is taken as position of the event. Active tool's handleMouseUp is called.
 * If a custom cursor is displayed then it is hidden at MouseOut. 
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseEventArgs event data from Silverlight which describes the event
 */
function handleMapMouseOut(sender, mouseEventArgs) {
    //console.log("handleMapMouseOut " + sender.Name);
	var clientId = getIdFromLayer(sender);
    var map = maps[clientId];
    if (root.isBlocked() || map.blocked == true) {
        return false;
    }
    if(!map.captureEvents){
	    map.enableEventLayer(false);
    }
    if (mouseDown && map.activeTool != null) {
        map.activeTool.handleMouseUp(clientId, lastPoint, mouseEventArgs);
    }
    mouseDown = false;
    return false;
	    }

/*============== Event Handling for managing custom cursor styles ==================*/

	/**
 * Handles Silverlight's mouse events on a map 
 * in order to manage the display of a custom cursor. 
 * To be called when the mouse enters the map or moves.
 * If a custom cursor is set then this method displays the cursor's image.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseEventArgs event data from Silverlight which describes the event
 */
function handleMouseCursorShow(sender, mouseEventArgs) {
    //console.log("handleMouseCursorShow " + sender.Name);
	var clientId = getIdFromLayer(sender);
	var map = maps[clientId];
	if (map == null) return ;
	
    // Save the current mouse position
    map.cursorPosition.moveTo(mouseEventArgs.GetPosition(null).X, mouseEventArgs.GetPosition(null).Y);

	// Check whether a custom cursor style is set. 
	// Then the image which represents the cursor must become visible 
	// and must be placed at the current mouse position.
	var cursor = sender.FindName("CustomMapCursor");
	if (cursor &&
		map.cursorPosition.x >= 0 && map.cursorPosition.y >= 0 ) {
		// Check whether the panLayer has been moved (because the user pans the map).
		// In that case: the mouse is re-positioned relative to the top left corner of the panLayer.
		// We subtract the movement of the panLayer to result in positioning the mouse relative to 
		// top left corner of content_root.
    	var panLayer = map.panLayer;
    	//  Get moved distance:
		var movedX = panLayer["Canvas.Left"];
		var movedY = panLayer["Canvas.Top"];
		
		if (cursor.visibility != "Visible") {
			cursor.visibility = "Visible";
				  }
		
		cursor["Canvas.Left"] = map.cursorPosition.x - map.hotspot.x - movedX;
		cursor["Canvas.Top"]  = map.cursorPosition.y - map.hotspot.y - movedY;
	        }
	    }

	/**
 * Handles Silverlight's MouseLeave event on a map 
 * in order to manage the display of a custom cursor. 
 * To be called when the mouse leaves the map.
 * If a custom cursor is set then the cursor's image is  hidden.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseEventArgs event data from Silverlight which describes the event
	 */
function handleMouseCursorHide(sender, mouseEventArgs) {
    //console.log("handleMouseCursorHide " + sender.Name);
    
    // Set the current mouse position as (-1,-1) indicating position outside of the map
	var clientId = getIdFromLayer(sender);
	var map = maps[clientId];
    map.cursorPosition.moveTo(-1,-1);

	// Check whether a custom cursor style is set. 
	// Then the image which represents the cursor must be hidden.
	var cursor = sender.FindName("CustomMapCursor");
	if (cursor) {
		if (cursor.visibility == "Visible") {
			cursor.visibility = "Collapsed";
		}
	    }
	    }


/** A helper function which gets the ClientId from the given "graphical layer" object.
 *  The ClientId is stored in the "Tag" property of the Silverlight object. */
function getIdFromLayer( obj ) {
	return (obj && obj.Tag) ? obj.Tag : null;
		}


/*============== Keyboard Event Handling ======================================================*/

/** Handles Silverlight's KeyDown event by calling root.handleOnKeyDownEvent().<br>
 *  root.js already has keyboard event handling. 
 *  That keyboard event handling is attached to the document.body object.
 *  However those handlers are not fired when the Silverlight plugin has the focus. 
 *  Therefore we provide additional keyboard event handling for Silverlight.<br>
 *  To identify the key code the Silverlight property "Key" is used. It gives the "portable key code", 
 *  which is not operating system-specific. This portable key code then is translated 
 *  into the key code used in JavaScript.
 *  @param sender the Silverlight object where the event handler is attached.
 *  @param mouseEventArgs event data from Silverlight which describes the event
 */
function handleSilverlightKeyDownEvent(sender, keyEventArgs) {
	// Use Silverlight's portable key code ...
	var key = keyEventArgs.Key;
	// ... and map it to the JavaScript key code
	key = _KeyCodeMapping.slPortableKeyCodeToJSKeyCode(key);
	// create a new object for our keyboardEvenHandler
	var eventinfo = { 
	  keyCode: key,
	  ctrlKey: keyEventArgs.ctrl,
	  shiftKey: keyEventArgs.shift,
	  altKey: false // the "alt" property is not available from Silverlight
	};
	root.handleOnKeyDownEvent(eventinfo);
		}

/** Handles Silverlight's KeyUp event by calling root.handleOnKeyUpEvent().
 * Also see handleSilverlightKeyDownEvent().
 *  @param sender the Silverlight object where the event handler is attached.
 *  @param mouseEventArgs event data from Silverlight which describes the event
 */
function handleSilverlightKeyUpEvent(sender, keyEventArgs) {
	// Use Silverlight's portable key code ...
	var key = keyEventArgs.Key;
	// ... and map it to the JavaScript key code
	key = _KeyCodeMapping.slPortableKeyCodeToJSKeyCode(key);
	// create a new object for our keyboardEvenHandler
	var eventinfo = { 
	  keyCode: key,
	  ctrlKey: keyEventArgs.ctrl,
	  shiftKey: keyEventArgs.shift,
	  altKey: false // the "alt" property is not available from Silverlight
	};
	root.handleOnKeyUpEvent(eventinfo);
	    }

/** Singleton class for mapping Silverlight's portable key codes to the key codes used in JavaScript. */
var _KeyCodeMapping = ( function() {
	// private property
	// Map portable Silverlight key codes from 0 to 82 - here represented as array index - 
	//   to their Javascript equivalent.
	var map = new Array();
	map[0]=	0;  //keynone
	map[1]=	8; 	//backspace
	map[2]=	9; 	//tab
	map[3]=	13;	//enter
	map[4]=	16;	//shift
	map[5]=	17;	//ctrl
	map[6]=	18;	//alt
	map[7]=	20;	//capslock
	map[8]=	27;	//escape
	map[9]=	32;	//space
	map[10]=33;	//pageup
	map[11]=34;	//pagedown
	map[12]=35;	//end
	map[13]=36;	//home
	map[14]=37;	//left
	map[15]=38;	//up
	map[16]=39;	//right
	map[17]=40;	//down
	map[18]=45;	//insert
	map[19]=46;	//delete
	map[20]=48;	//0
	map[21]=49;	//1
	map[22]=50;	//2
	map[23]=51;	//3
	map[24]=52;	//4
	map[25]=53;	//5
	map[26]=54;	//6
	map[27]=55;	//7
	map[28]=56;	//8
	map[29]=57;	//9
	map[30]=65;	//a
	map[31]=66;	//b
	map[32]=67;	//c
	map[33]=68;	//d
	map[34]=69;	//e
	map[35]=70;	//f
	map[36]=71;	//g
	map[37]=72;	//h
	map[38]=73;	//i
	map[39]=74;	//j
	map[40]=75;	//k
	map[41]=76;	//l
	map[42]=77;	//m
	map[43]=78;	//n
	map[44]=79;	//o
	map[45]=80;	//p
	map[46]=81;	//q
	map[47]=82;	//r
	map[48]=83;	//s
	map[49]=84;	//t
	map[50]=85;	//u
	map[51]=86;	//v
	map[52]=87;	//w
	map[53]=88;	//x
	map[54]=89;	//y
	map[55]=90;	//z
	map[56]=112;//f1
	map[57]=113;//f2
	map[58]=114;//f3
	map[59]=115;//f4
	map[60]=116;//f5
	map[61]=117;//f6
	map[62]=118;//f7
	map[63]=119;//f8
	map[64]=120;//f9
	map[65]=121;//f10
	map[66]=122;//f11
	map[67]=123;//f12
	map[68]=96;	//numpad0
	map[69]=97;	//numpad1
	map[70]=98;	//numpad2
	map[71]=99;	//numpad3
	map[72]=100;//numpad4
	map[73]=101;//numpad5
	map[74]=102;//numpad6
	map[75]=103;//numpad7
	map[76]=104;//numpad8
	map[77]=105;//numpad9
	map[78]=106;//multiply
	map[79]=107;//add
	map[80]=109;//subtract
	map[81]=110;//decimalpoint
	map[82]=111;//devide
	map[255]=255;//key unknown

	// Method which will be revealed by return statement below
	/** Map Silverlight's portable key code to the JavaScript key code.
	 * @param code a portable key code from Silverlight 
	 * @return the JavaScript key code
	 * @ignore
	 * */
	function slPortableKeyCodeToJSKeyCode(code) {
		return map[code];
	}

	return {
		slPortableKeyCodeToJSKeyCode : slPortableKeyCodeToJSKeyCode
};

}() ); // immediate execution instead of constructor to implement singleton


/*==================== Other methods ===============================================================*/

/**
 * Initialises a map. Will be called after the map page and the Silverlight plugin is loaded. 
 * Only used by the map tag.
 * @ignore
*/
function initMap(clientId, hasKingsMoves, centre, rotation, viewScale, world, crs, unit) {
    var map = new Map(clientId);
    map.layer = document.getElementById("fullspacediv" + clientId);
    maps[clientId] = map;
    map.hasKingsmoves = hasKingsMoves == true;
    map.createMapLayers(clientId);

	 // map info
	 map.setCentre(centre);
	 map.setRotation(rotation);
	 map.setViewScale(viewScale);
	 map.setWorld(world);
     map.setCrs(crs);
	 map.setUnit(unit);

    root.registerObject(map);

	// fixes CBG00122552
    root._setInitialRequest();
}
/**
 * Removes a map. Is called on unload of the page.
 */
function releaseMap(clientId) {
	if (maps[clientId] != null) {
	 maps[clientId].unload();
    maps[clientId] = null;
    if (maps.length == 0) {
        delete maps;
    }
}
	}


/** Event handler for a blocked map.
 * @param sender the Silverlight object which handles the event, that is where the event handler is attached. This is not necessarily the source object that raised the event. 
 * @param mouseEventArgs event data from Silverlight which describes the event
 */
function blockMap(sender,mouseEventArgs) {
	// Do nothing
	var clientId = getIdFromLayer(sender);
    var map = maps[clientId];
    if(map && map.blocker){
    	map.blocker.handleBlockEvent();
        }
    try {
    	mouseEventArgs.Handled = true;
	} catch (e) {}
    }


/** Displays error messages, for example during development phase. */
function SilverlightPluginErrorEventHandler(sender, errorArgs)
{
    // The error message to display.
    var errorMsg = "Silverlight Error: \n\n";
    
    // Error information common to all errors.
    errorMsg += "Error Type:    " + errorArgs.errorType + "\n";
    errorMsg += "Error Message: " + errorArgs.errorMessage + "\n";
    errorMsg += "Error Code:    " + errorArgs.errorCode + "\n";
    errorMsg += "URL:           " + document.URL + "\n";
    
    // Determine the type of error and add specific error information.
    switch(errorArgs.errorType)
    {
        case "RuntimeError":
            // Display properties specific to RuntimeErrorEventArgs.
            if (errorArgs.lineNumber != 0)
            {
                errorMsg += "Line: " + errorArgs.lineNumber + "\n";
                errorMsg += "Position: " +  errorArgs.charPosition + "\n";
            }
            errorMsg += "MethodName: " + errorArgs.methodName + "\n";
            break;
        case "ParserError":
            // Display properties specific to ParserErrorEventArgs.
            errorMsg += "Xaml File:      " + errorArgs.xamlFile      + "\n";
            errorMsg += "Xml Element:    " + errorArgs.xmlElement    + "\n";
            errorMsg += "Xml Attribute:  " + errorArgs.xmlAttribute  + "\n";
            errorMsg += "Line:           " + errorArgs.lineNumber    + "\n";
            errorMsg += "Position:       " + errorArgs.charPosition  + "\n";
            break;
        default:
            break;
	 }
    // Display the error message.
    alert(errorMsg);
    }

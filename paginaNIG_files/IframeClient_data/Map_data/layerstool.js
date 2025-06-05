/** The layers tool controls the layers widget implemented in Silverlight. */

var LayersTool = {
    //fields:
    // id of layers tool
    id : null,
    map : null,    
    silverlightPlugin : null,
    widget : null,
    layer : null,
    //isActive : false,

    // Tool methods which call methods in the widget
    
	/** Displays the Layers widget. */
	activate : function() {
		this.widget.showLayersWidget();
	},

	/** Hides the Layers widget. */
	deactivate : function() {
		this.widget.hideLayersWidget();
	},

    /** Sets the list of layers. Completely exchanges
     * the layers of the layers widget.
	 * @param layersList array of Layer instances
     */
    setLayers : function(layersList) {
    	this.widget.setLayers(layersList);
    },
    
    /** Changes the enabled state for one or more layers. 
     * The layers already have to be present in the LayersTool.
	 * @param layersList array of Layer instances
     */
    changeLayersVisibility : function(layersList) {
    	this.widget.changeLayersVisibility(layersList);
    },
    
    // Tool methods called from the widget
    
    /** Submits the state of a layer to the server.
	 * @param layerName internal name of the layer whose selection state changed
	 * @param layerEnabled state (enable/disable) of the layer
     */
    layerStateChanged : function(layerName, layerEnabled) {
    	var parameters = {
    		layerName: layerName,
    		layerEnabled: layerEnabled,
    		actionType: "layerStateChanged"
        };
        // Submit the form 
        this.map.submit("layers", parameters);
        return true;
	},

    /** Submits the request to the server which hides the widget. */
	hide : function() {
    	var parameters = {
    		actionType: "hide"
        };
        // Submit the form 
        this.map.submit("layers", parameters);
        return true;
	}
};


/**
 * Initialises the layers tool.
 * @param clientId id of the layers tool
 * @param mapClientId id of the map
 * @param active indicates whether the tool is visible and active
 */
function initLayersTool(clientId, mapClientId, active) {
	LayersTool.id = clientId;  // TODO Alternative:   'layersTool' + mapClientId;
	
	// TODO map, mapClientId, layer necessary?
	LayersTool.map = Map.getMap(mapClientId);
	LayersTool.layer = LayersTool.map.toolsLayer;
	
	LayersTool.silverlightPlugin = document.getElementById("SilverlightPlugin");
    LayersTool.widget = LayersTool.silverlightPlugin.content.silverlightApp;

    root.registerObject(LayersTool);
    
    // Register a callback method which will be called from the layers widget
    // when user selects a layer
    LayersTool.widget.layerStateChanged = layerStateChangedCallback;

    // Register a callback method which will be called from the layers widget
    // when the user wants to close the widget.
    LayersTool.widget.hideWidget = hideLayersWidgetCallback;
    
    if (active) {
    	LayersTool.activate();
    } else {
    	LayersTool.deactivate();
    }
}


/** Constructor for a Layer with internal and external name and state. */
function Layer(internalName, externalName, state ) {
    this.internalLayerName = internalName;
    this.externalLayerName = externalName;
    this.layerTurnedOn = state;
}


/** Callback method which will be called from the layers widget
 * whenever the user changes the  state (enable/disable) of a layer. 
 */
function layerStateChangedCallback(sender,result) {
	LayersTool.layerStateChanged(result.layerName, result.layerEnabled);
}

/** Callback method which will be called from the layers widget
 * when the user wants to close the widget by clicking
 *  the [x] button in the top right-hand corner of the widget. 
 */
// Note the hideLayersWidgetCallback and the hideViewWidgetCallback are
// assigned to the same event "hideWidget". Therefore each of the call-backs
// has to cover hiding of the layers widget AND the view widget.
function hideLayersWidgetCallback(sender,result) {
	if (result.widgetName == "Layer") {
		LayersTool.hide();
	} else if (result.widgetName == "View") {
		ViewTool.hide();
	}
}

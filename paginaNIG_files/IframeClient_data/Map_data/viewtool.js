/** The view tool controls the view widget implemented in Silverlight. 
 * The following methods call the API of the view widget or are called from it. */

var ViewTool = {
    //fields:
    // id of view tool
    id : null,
    map : null,    
    silverlightPlugin : null,
    widget : null,
    layer : null,
    //isActive : false,

    // --------------- Tool methods which call methods in the widget
    
	/** Displays the view widget. */
	activate : function() {
		this.widget.showViewsWidget();
	},

	/** Hides the view widget. */
	deactivate : function() {
		this.widget.hideViewsWidget();
	},

    /** Sets the list of views. Completely exchanges
     * the views of the vies widget.
	 * @param viewsList array of View instances
     */
    setViews : function(viewsList) {
    	this.widget.setViews(viewsList);
    },
    
    /** Informs the widget that a new view has been created on request of the widget. 
     * Adds a new view to the view tool, makes it the new current view and makes it editable.
     * 
	 * @param internalViewName internal name of the view which has been added
	 * @param externalViewName the external name of the new view
     */
    addNewView : function(internalViewName,externalViewName) {
    	var viewDetails = new View(internalViewName,externalViewName);
    	// Add the new view to the list of views.
    	this.widget.addNewView(viewDetails);
    	// The new view becomes the new current view.
    	this.widget.selectView(viewDetails);
    	// After a new view is created then its name can be edited.
    	this.widget.renameViewInEditMode(viewDetails);
    },

    /** Informs the widget that a view has been deleted. 
	 * @param internalViewName internal name of the view which has been deleted
	 * @param externalViewName the external name of the deleted view
     */
    deleteView : function(internalViewName,externalViewName) {
    	this.widget.deleteCurrentView(new View(internalViewName,externalViewName));
    },

    /** Informs the widget that another view has been selected. 
	 * @param internalViewName internal name of the view which has been selected
	 * @param externalViewName the new external name which should be edited
     */
    selectView : function(internalViewName,externalViewName) {
    	this.widget.selectView(new View(internalViewName,externalViewName));
    },

    /** Informs the widget that layers and/or overrides of the current view have changed. */
    currentViewAltered : function() {
    	this.widget.currentViewAltered();
    },

    /** Informs the widget that the current view has been saved 
     * and the "View Altered" state should be reset. */
    currentViewAlteredReset : function() {
    	this.widget.saveCurrentView();
    },

    /** Informs the widget that the view identified by internalViewName
     * should be renamed. The externalViewName is the name which should
     * be displayed in the widget and which should be edited by the user.
	 * @param internalViewName internal name of the view
	 * @param externalViewName the new external name which should be edited  
	 */
    renameEditView : function(internalViewName,externalViewName) {
    	this.widget.renameViewInEditMode(new View(internalViewName,externalViewName));
    },

    /** Informs the widget that the view identified by internalViewName
     * has been renamed and the rename action is finished. 
     * The externalViewName is the new name which should
     * be displayed in the widget.
	 * @param internalViewName internal name of the view
	 * @param externalViewName the new external name  */
    renameView : function(internalViewName,externalViewName) {
    	this.widget.renameCurrentView(new View(internalViewName,externalViewName));
    },


    // ---------------  Tool methods called from the widget. 
    // They pass parameters from the browser to the client on the server.
    
    /** Submits the saving of a view to the server.
	 * @param viewName internal name of the view to be saved
     */
    save : function(viewName) {
    	var parameters = {
    			viewName: viewName,
    			actionType: "save"
        };
        // Submit the form 
        this.map.submit("view", parameters);
        return true;
	},

    /** Submits the selection of a view to the server.
	 * @param viewName internal name of the view to be selected
     */
    select : function(viewName) {
    	var parameters = {
    			viewName: viewName,
    			actionType: "select"
        };
        // Submit the form 
    	this.map.submit("view", parameters);
        return true;
	},

    /** Submits the change of the default view to the server.
     * This is called when the user selects a view to become the new default view.
	 * @param viewName internal name of the view which became default
     */
	changeDefault : function(viewName) {
    	var parameters = {
    			viewName: viewName,
    			actionType: "changeDefault"
        };
        // Submit the form 
        this.map.submit("view", parameters);
        return true;
	},

    /** Submits the request for a new view to the server.
     * This requests that the client should create a new view 
     * for the current visibility settings.
     */
	create : function() {
    	var parameters = {
    			actionType: "create"
        };
        // Submit the form 
        this.map.submit("view", parameters);
        return true;
	},

	/** Submits the request for deleting a view to the server.
	 * @param viewName internal name of the view to be saved
	 */
	remove : function(viewName) {
		var parameters = {
				viewName: viewName,
				actionType: "delete"
	    };
	    // Submit the form 
	    this.map.submit("view", parameters);
	    return true;
	},
	
	/** Submits the request for renaming a view to the server.
	 * @param viewName internal name of the view to be renamed
	 * @param newViewName the new name of the view
	 */
	rename : function(viewName, newViewName) {
		var parameters = {
				viewName: viewName,
				externalViewName: newViewName,
				actionType: "rename"
	    };
	    // Submit the form 
	    this.map.submit("view", parameters);
	    return true;
	},

    /** Submits the request to the server which hides the widget. */
	hide : function() {
    	var parameters = {
    		actionType: "hide"
        };
        // Submit the form 
        this.map.submit("view", parameters);
        return true;
	}
};


/**
 * Initialises the view tool.
 * @param clientId id of the view tool
 * @param mapClientId id of the map
 * @param active indicates whether the tool is visible and active
 */
function initViewTool(clientId, mapClientId, active) {
	ViewTool.id = clientId;  // TODO Alternative:   'viewTool' + mapClientId;
	
	// TODO map, mapClientId, layer necessary?
	ViewTool.map = Map.getMap(mapClientId);
	ViewTool.layer = ViewTool.map.toolsLayer;
	
	ViewTool.silverlightPlugin = document.getElementById("SilverlightPlugin");
	ViewTool.widget = ViewTool.silverlightPlugin.content.silverlightApp;

    root.registerObject(ViewTool);
    
    // Register call-back methods which will be called from the view widget
    // when user 
    // - selects a view to load it
    // - saves an existing view (that is one with an existing name) with the current visibilities
    // - saves a new view (that is one with an new name) with the current visibilities.
    // - renames an existing view. Changes only the name, not the visibilities contained in the view.
    // - deletes an existing view
    // - define an existing view as default
    
    // Register a call-back method which will be called from the view widget
    // when user wants to save a view
    ViewTool.widget.saveChangedView = saveViewCallback;

    // Register a call-back method which will be called from the view widget
    // when user selects a view
    ViewTool.widget.viewSelectionChanged = viewSelectedCallback;

    // Register a call-back method which will be called from the view widget
    // when user selects another view to become the new default view.
    ViewTool.widget.defaultViewChanged = defaultViewChangedCallback;

    // Register a call-back method which will be called from the view widget
    // when the user wants to create a new view. 
    ViewTool.widget.createNewView = createViewCallback;

    // Register a call-back method which will be called from the view widget
    // when the user deleted a view in the widget. 
    ViewTool.widget.deleteView = deleteViewCallback;

    // Register call-back methods which will be called from the view widget
    // when the user starts and finishes renaming a view in the widget. 
    ViewTool.widget.renameViewStarted = renameViewStartedCallback;
    ViewTool.widget.renameView = renameViewCallback;
    
    // Register a call-back method which will be called from the view widget
    // when the user wants to close the widget.
    ViewTool.widget.hideWidget = hideViewWidgetCallback;
 
    if (active) {
    	ViewTool.activate();
    } else {
    	ViewTool.deactivate();
    }
}


/** Constructor for a View with internal and external name and state. */
function View(internalName, externalName) {
	this.externalViewName = externalName;
	this.internalViewName = internalName;
}

// Call-back methods which are registered in the view widget and can be called from the widget.

/** Call-back method which will be called from the view widget
 * when the user wants to save a view. 
 */
function saveViewCallback(sender, result) {
	ViewTool.save( result.viewInternalName );
}

/** Call-back method which will be called from the view widget
 * when the user selects a view. 
 */
function viewSelectedCallback(sender, result) {
	ViewTool.select( result.viewInternalName );
}

/** Call-back method which will be called from the view widget
 * when the user chooses another view to become the new default view. 
 */
function defaultViewChangedCallback(sender, result) {
	ViewTool.changeDefault( result.viewInternalName );
}

/** Call-back method which will be called from the view widget
 * when the user wants to create a new view. 
 */
function createViewCallback(sender, result) {
	ViewTool.create();
}

/** Call-back method which will be called from the view widget
 * when the user wants to delete a new view. 
 */
function deleteViewCallback(sender, result) {
	ViewTool.remove( result.viewInternalName );
}

/** Call-back method which will be called from the view widget
 * when the user wants to rename a view (start of renaming). 
 */
function renameViewStartedCallback(sender, result){
	// temporarily stop the client's key handling so that
	// the left/right arrow keys can be used in the Silverlight
	// input field for entering a view name and they do not pan the map.
	root.setBlockKey();
}

/** Call-back method which will be called from the view widget
 * when the user finishes renaming of a view (user has entered the new name).
 */
function renameViewCallback(sender, result) {
	ViewTool.rename( result.viewInternalName, result.viewExternalName );
	root.unsetBlockKey();
}

/** Call-back method which will be called from the views widget
 * when the user wants to close the widget by clicking
 *  the [x] button in the top right-hand corner of the widget. 
 */
//Note the hideLayersWidgetCallback and the hideViewWidgetCallback are
//assigned to the same event "hideWidget". Therefore each of the call-backs
//has to cover hiding of the layers widget AND the view widget.
function hideViewWidgetCallback(sender,result) {
	if (result.widgetName == "Layer") {
		LayersTool.hide();
	} else if (result.widgetName == "View") {
		ViewTool.hide();
	}
}

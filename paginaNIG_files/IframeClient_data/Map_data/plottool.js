/** Plot tool */

PlotTool = {
	//fields:
	// id of plot tool
	id : null,
	// Component's id (map ClientId)
	mapClientId : null,
	// stores the plot boxes
	plotBoxes : null,
	// Number of the active box among the plot boxes. 
	// The numbers are integers >= 0. -1 indicates no box is active.
	activePlotBoxIndex : -1, 

    svgdoc : null,
    
    layer : null,
    
    isActive : false,
    
	// Tool methods
	/**
     * Activates the tool.
	 */
	activate : function(clientId) {
        // Show all plot boxes and put them onto active layer
        this.map.setCursor("Default");  
        PlotTool.isActive = true;
        var i;
		for (i = 0; i < this.plotBoxes.length; i++) {
			this.show(this.plotBoxes[i]);            
			this.plotBoxes[i].setLayer(this.layer);
		}
	},
	
	/**
     * Deactivates the tool.
	 */
	deactivate : function(clientId) {
         PlotTool.isActive = false;
     },
    
    /** Sets the center.
     * Can be called with one DynPoint parameter or with two numbers x and y.
     * @param ptCenter can be a DynPoint which defines the center. Then the second parameter is not used.
     * @param y a number which is the y coordinate of the center. 
     *        This is used when the first parameter is given as a number (the x coordinate)
     */
    setCenter: function(ptCenter, y, boxIndex) {
        this.plotBoxes[boxIndex].setCenter(ptCenter, y);
    },
    /** Gets the center.  */
    getCenter: function(boxIndex) {
        return this.plotBoxes[boxIndex].getCenter();
	},

    /* Set/get sizes. */
    setWidth: function(width, boxIndex) {
        this.plotBoxes[boxIndex].setWidth(width);
    },
    getWidth: function(boxIndex) {
        return this.plotBoxes[boxIndex].getWidth();
    },
    setHeight: function(height, boxIndex) {
        this.plotBoxes[boxIndex].setHeight(height);
    },
    getHeight: function(boxIndex) {
        return this.plotBoxes[boxIndex].getHeight();
    },

    setRotation: function(rotation, boxIndex) {
        this.plotBoxes[boxIndex].setRotation(rotation);
    },
    getRotation: function(boxIndex) {
        return this.plotBoxes[boxIndex].getRotation();
    },        
     /** Calculates the position from center coordinates. */
    repaint: function(boxIndex) {       
        this.plotBoxes[boxIndex].repaint();
    },
	/**
     * Activates the box with the given number and deactivates the other boxes. 
	 * This colors the active box as active (red) and the others as inactive (black).
	 */
	activatePlotBox : function( boxIndex ) {
		var toBeActivated;
		if (boxIndex >= 0 && boxIndex < this.plotBoxes.length) {
			// Iterate over all plotboxes
            for (var i = 0; i < this.plotBoxes.length; i++) {
				toBeActivated = i == boxIndex;
				this.plotBoxes[i].activate(toBeActivated);
			}
			this.activePlotBoxIndex = boxIndex;
		}
	},
			
	/**
     * Adds a plot box.
	 */
	addPlotBox : function( mapClientId, index, selected,
    		centerX, centerY, width, height, rotation, visible) {     
                
		var box = new DynRotateBox( "plotBox"+index+mapClientId, 
					centerX, centerY, width, height, rotation, true );
     
        var map = Map.getMap(mapClientId);
        box.setLayer(this.layer);
		box.mapId = mapClientId;	
		box.init();
        box.boxType = "plot";
		box.boxIndex = index; // new property for the DynRotateBox
		box.activate(selected);
	
		this.plotBoxes.push(box);

		if (selected) {
			this.activatePlotBox(index);
		}
        this.setCenter(centerX, centerY, index);
        this.setWidth(width, index);
        this.setHeight(height, index);
        this.setRotation(rotation, index);

        this.repaint(index);

        if (visible === undefined) {
        	visible = true;
        }
       	if (!visible) {
       		this.hide(this.plotBoxes[index]);
       	}

		return box;
	},

    /** Hides all plot boxes. */
	hideAllBoxes : function() {
        var i;
		for (i = 0; i < this.plotBoxes.length; i++) {
            this.hide(this.plotBoxes[i]);
		}
	},
	
	/**
     * Deletes a plot box (which is of type "DynRotateBox").
	 */
	removePlotBox : function( box ) {
		if (box != null) {
            box.layer.Children.remove(box.box);    		
			delete box;
		}
	},

	/**
     * Deletes all plot boxes and destroys them.
	 */
	removeAllPlotBoxes : function() {
		while (this.plotBoxes.length > 0) {
			var box = this.plotBoxes.pop();
			// delete the box
			this.removePlotBox( box );
		}
	},
	
	/**
     * Handles mouseDown action.
	 */
	handleMouseDown : function(clientId, pt){
		var box = null; // get current active box
		if (this.activePlotBoxIndex >= 0) {
			box = this.plotBoxes[this.activePlotBoxIndex]; 
		}
        if (box != null) {
		
            if (box.isDragging) {
				box.beginDragging(pt);
                this.map.setCursor("cursor_moveplotframe.png");
				return;
            } else if (box.isRotating) {
				box.beginRotating(pt.distanceTo(box.getCenter()));
                this.map.setCursor("cursor_rotate.png");
				return;
            } else if (box.isResizing) {
				box.beginResizing(pt.distanceTo(box.getCenter()));
                this.map.setCursor("cursor_resize.png");
				return;
			}
		}
	},
	
	/**
     * Handles mouseMove action.
	 */
    handleMouseMove : function(clientId, pt, event) {
		var box = null; // current active box
		if (this.activePlotBoxIndex >= 0) {
			box = this.plotBoxes[this.activePlotBoxIndex]; 
		}

		if (box != null) {
            if (box.isDragging) {            
				box.drag(pt);
            } else if (box.isRotating) {
				box.rotate(pt.distanceTo(box.getCenter()));
            } else if (box.isResizing) {
				box.resize(pt.distanceTo(box.getCenter()));
			}
		}
	},
	
	/**
     * Handles mouseUp action.
	 */
    handleMouseUp : function(clientId, pt, event) {
		var box = null; // current active box
		if (this.activePlotBoxIndex >= 0) {
			box = this.plotBoxes[this.activePlotBoxIndex]; 
		}

		if (box != null) {
			var action;
			action = "other";
        if (box.isDragging) {            
            box.endDragging(new DynPoint(pt));
            box.isDragging = false;
            action = "panMap";
        } else if (box.isRotating) { 
				box.endRotating(pt.distanceTo(box.getCenter()));
            box.isRotating = false;
				action = "rotate";
        } else if (box.isResizing) {            
				box.endResizing(pt.distanceTo(box.getCenter()));
            box.isResizing = false;
            action = "zoomMap";
			}
            this.map.setCursor("Default");
			this.submit(clientId, action);
		}
	},
	/**
     * Sets the layer of the PlotTool. This will directly affect all boxes.
     */
    setLayer : function(layerId) {
        this.layer = this.svgdoc.getElementById(layerId);
        var i;
        for (i = 0; i < this.plotBoxes.length; i++) {
            this.plotBoxes[i].setLayer(this.layer);
        }
    },
    /**
     * Submits the tool data to the server. 
     * Collects the relevant data (size, position, rotation, action) to be submitted.
     * Calls the map's submit method.
	 */
	submit : function(clientId, action) {
		var box = null; // current active box
		if (this.activePlotBoxIndex >= 0) {
			box = this.plotBoxes[this.activePlotBoxIndex]; 
		}
        if (box && action) {
            var parameters = {
                action: action,
                boxX: Math.round(box.center.x),
                boxY: Math.round(box.center.y),
                boxWidth: Math.round(box.width),
                boxHeight: Math.round(box.height),
                boxRotation: box.rotation,
                boxIndex: box.boxIndex
            };
            // Submit the form 
            this.map.submit("plot",parameters);
	}
    },
    
    /** 
     * Shows the plot box.
     * Just adds the existing plot box to the layer.
     */
     show : function(box) {        
        this.layer.Children.Add(box.box);
     },
     
     hide : function(box) {        
        this.layer.Children.Remove(box.box);
     }
     
};



/**
 * Activates the plot tool.
 */
function activateRotateBox(box, submit) {
	PlotTool.activatePlotBox( box.boxIndex );
}

/**
 * Adds the method activatePlotTool to the map.
 * That method activates the plotTool.
 */
Map.prototype.activatePlotTool = function() {
	this.activateTool(PlotTool);
};

Map.prototype.hideAllPlotBoxes = function() {
	PlotTool.hideAllBoxes();
};

/**
 * Initialises the plot tool.
 * @param mapClientId id of the map
 */
function initPlotTool(mapClientId) {
	PlotTool.id = 'plotTool'+mapClientId;
	PlotTool.mapClientId = 'plotBox'+mapClientId;
	PlotTool.plotBoxes = new Array(0);
	
    PlotTool.map = Map.getMap(mapClientId);
    PlotTool.layer = PlotTool.map.toolsLayer;
	root.registerObject(PlotTool);
}

function releasePlotTool(clientId){
	// TODO box does not exist anymore
	delete PlotTool.box;
}

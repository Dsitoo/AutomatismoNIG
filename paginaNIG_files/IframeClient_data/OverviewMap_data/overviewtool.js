/** The overview tool is a tool (normally a frame) displayed on an overview map 
* and can be used by the user for navigating and zooming, 
* or it can be updated by the client itself. 
*/
var OverviewTool = {
    /* id is a string which identifies this object. */
    id : null,
    /* layer is a Silverlight canvas. */
    layer : null,
    /* map is an object of the JavaScript Map class. */
    map : null,
    /* The rotatable box (JavaScript object) */
    box : null,
    startPoint : null,
    lastPoint : null,
    getAllMoves : true,

	/**
    * Activates, enables and displays this tool.
    * @param clientId id of the map
	 */
	activate : function(clientId) {
        this.map.setCursor("cursor_newoverview.png"); 
        this.box.activate(true);
	},
    
	/**
    * Deactivates this tool.
    * @param clientId id of the map
	 */
	deactivate : function(clientId) {
        this.box.activate(false);
    },

    /** Sets the center.
     * Can be called with one DynPoint parameter or with two numbers x and y.
     * @param ptCenter can be a DynPoint which defines the center. Then the second parameter is not used.
     * @param y a number which is the y coordinate of the center. 
     *        This is used when the first parameter is given as a number (the x coordinate)
     */
    setCenter: function(ptCenter, y) {
        this.box.setCenter(ptCenter, y);
    },
    /** Gets the center.  */
    getCenter: function() {
        return this.box.getCenter();
    },
    
    /* Set/get sizes. */
    setWidth: function(width) {
        this.box.setWidth(width);
    },
    getWidth: function() {
        return this.box.getWidth();
    },
    setHeight: function(height) {
        this.box.setHeight(height);
    },
    getHeight: function() {
        return this.box.getHeight();
    },
    
    setRotation: function(rotation) {
        this.box.setRotation(rotation);
    },
    getRotation: function() {
        return this.box.getRotation();
	},
	/**
     * Handles the mouseDown action.
	 */
    handleMouseDown : function(clientId, point, mouseEventArgs){
		if (this.box != null) {
            this.startPoint = new DynPoint(point.x, point.y);
            if (this.box.isDragging) {
                // user is pulling the tool
                this.map.setCursor("cursor_moveoverview.png");                
                this.lastPoint = new DynPoint(point.x, point.y);				
                this.box.beginDragging(point);                
            } else if (this.box.isResizing) {
                // User is resizing the tool
                this.map.setCursor("cursor_resize.png");
                this.lastPoint = new DynPoint(point.x, point.y);
                this.box.beginResizing(this.lastPoint.distanceTo(this.box.getCenter()));             
            } else {
                // user clicks into the overview map
                //this.box.setCenter( point );
                this.map.setCursor("cursor_newoverview.png"); 
				this.oldWidth = this.box.getWidth();
				this.oldHeight = this.box.getHeight();
				this.oldRotation = this.box.getRotation();
                
                this.box.drawNew = true;
				this.box.hideDragBoxes(true);
				this.box.hideCenter(true);
                this.box.hideBottomLine(true);
                
                this.box.setSize(1, 1);
                this.box.setRotation(0);
                this.box.setCenter(point.x, point.y);                
			}
		}
	},
	/**
     * Handles the mouseMove action.
	 */
    handleMouseMove: function(clientId, point, mouseButtonEventArgs) {
        if (this.box !== null) {
            if (this.box.isDragging) {	            			
                this.box.drag(point);                
            }else if (this.box.isResizing) {
                this.box.resize(point.distanceTo(this.box.getCenter()));
            }else if (this.box.drawNew) {
                var dist = point.distanceTo(this.startPoint.x, this.startPoint.y);
                this.box.setSize(Math.abs(dist.x), Math.abs(dist.y));
                this.box.setCenter((point.x + this.startPoint.x)/2, (point.y + this.startPoint.y)/2);
			}
		}
	},
	/**
     * Handles the mouseUp action.
	 */
    handleMouseUp: function(clientId, point, mouseButtonEventArgs) {
        if (this.box !== null) {
			var action;
            if (this.box.isDragging) {
                this.box.isDragging = false;
                this.box.endDragging(point);				
				action = "panMap";
            } else if (this.box.isResizing) {
                this.box.isResizing = false;
                this.box.endResizing(point.distanceTo(this.box.getCenter()));                
				action = "zoomMap";
			} else {
                this.box.drawNew = false;
				this.box.hideDragBoxes(false);
				this.box.hideCenter(false);
                this.box.hideBottomLine(false);
                var dist = point.distanceTo(this.startPoint.x, this.startPoint.y);
				if(Math.abs(dist.x)<=3 && Math.abs(dist.y)<=3){
					this.box.setSize(this.oldWidth, this.oldHeight);
					this.box.setRotation(this.oldRotation);
                    this.box.setCenter(this.startPoint);                    
					action = "panMap";
				} else {
                    var cent = dist.scaleSize(0.5).moveBy(this.startPoint);
					if(cent.x<0 || cent.y<0){
						this.box.setSize(this.oldWidth, this.oldHeight, true);
						return;
					}
					this.box.setRotation(0);
                    this.box.setSize(Math.abs(dist.x), Math.abs(dist.y), true);
					this.box.setCenter(cent);
					action = "newBox";
				}
			}
            this.map.setCursor("cursor_newoverview.png");
			this.submit(clientId, action);
		}
	},

    /** Calculate the position from center coordinates. */
    repaint: function() {       
        this.box.repaint();
    },
    
    
	/**
    * Submits the tool data to the server. 
    * Collects the relevant data (size, position, rotation, action) to be submitted.
    * Calls the map's submit method.
	 */
	submit : function(clientId, action) {
        if (this.map && action) {
            var parameters = {
                    action: action,
                    boxX: Math.round( this.getCenter().getX() ),
                    boxY: Math.round( this.getCenter().getY() ),
                    boxWidth: Math.round( this.getWidth() ),
                    boxHeight: Math.round( this.getHeight() ),
                    boxRotation: this.getRotation()
            };
            // Submit the form 
            this.map.submit("overview",parameters);
        }
	}
};

function activateRotateBox(box, submit) {
}

/**
 * Initializes the overviewTool. Called by the tool's renderer.
 * Creates, displays and enables the tool.<br> 
 * Set initial size and position of the tool.
 * Registers the tool, so that it can be found later for updating its size and position.
 *
 * @param clientId id of the map
 * @param centerX initial x coordinate of center for the overview frame
 * @param centerY initial y coordinate of center for the overview frame
 * @param width initial width of the overview frame
 * @param height initial height of the overview frame
 * @param rotation initial rotation of the overview frame
 */
function initOverviewTool(clientId, centerX, centerY, width, height, rotation) {
    var map = Map.getMap(clientId);
    
    OverviewTool.id = 'overviewTool'+clientId;
    OverviewTool.map = map;
    OverviewTool.layer = map.toolsLayer;
    
    // Create a new rotatable box
    OverviewTool.box = new DynRotateBox('overviewBox'+clientId, centerX, centerY, width, height, rotation, true );   
    
    OverviewTool.box.setLayer(OverviewTool.layer);
    
    // Define which interaction the user can do with the tool
    OverviewTool.box.rotatable = false;
    OverviewTool.box.resizable = true;
    OverviewTool.box.panable = true;
    OverviewTool.box.activatable = false;
    
    // Display the box
    OverviewTool.box.init();    
    OverviewTool.box.boxType = "overview";
    // Enable the tool	
    map.activateTool(OverviewTool);

    OverviewTool.setCenter(centerX, centerY);
    OverviewTool.setWidth(width);
    OverviewTool.setHeight(height);
    OverviewTool.setRotation(rotation);
    OverviewTool.repaint();
    
    // Register the tool, so that it can be found later for updating its size and position.
    // This is a reference to the JavaScript object, not the Silverlight object.
    root.registerObject(OverviewTool);
}

function releaseOverviewTool(clientId){
    //delete overviewTool
    // TODO to be reviewed
    root.unregisterObject('overviewBox'+clientId);
    root.unregisterObject('overviewTool'+clientId);
}

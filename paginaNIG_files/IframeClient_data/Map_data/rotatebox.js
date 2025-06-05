/**
 * Constructor for a rotatable box.
 * @class 
 * The DynRotateBox provides a frame/box currently used for the plot dialog and the overview map. 
 * It has corners for rotating, boxes for resizing and a center for moving the box.
 * @constructor
 */
DynRotateBox = function(id, centerX, centerY, width, height, rotation, active) {
    this.id = id||null;
    // Register this object in the root so that we can later retrieve this JavaScript object
    // in event handlers, e.g. startMoving(), where we only get the sending Silverlight object.
	root.registerObject(this);
	
	this.layer = null;
    
	this.center = new DynPoint(centerX||0, centerY||0);
    this.width = width||1;
    this.height = height||1;
	this.rotation = rotation||0;
	this.startWidth = 0;
	this.startHeight = 0;
    this.startRotation = 0;  
    this.bIsActive = active||true;
	
    // booleans describing the interaction with the box.
    // These control whether the handles are displayed.
    // For example, rotatable = false means the box can be rotated programmatically, 
    //   but it has no corner handles so that the user cannot roatate the box.
	this.rotatable = true;
	this.resizable = true;
	this.panable = true;
	// helper to make the box itself 'unclickable'
	this.activatable = true;

    // The Silverlight object which represents the rotatable box
    this.box = null;
    
    this.boxType = null;
    
    this.zIndex = 0;
    
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    
    this.CORNER_WIDTH = 10;    
    this.dragBoxesHidden = false;    
    this.firstMove = false;   
    
	return this;	
};

DynRotateBox.prototype = {
    setLayer : function(layer) {
        this.layer = layer;
	},
	
    init : function() {
        if (this.layer !== null) {
            // Retrieve a reference to the plug-in.
            var plugin = this.layer.getHost().content;
            // Set box id as the Canvas name
            // Top and Left of this Canvas is designed such that it 
            // coincides with the center of the box.The other components 
            // are calculated relatively, in the repaint method.
            this.box = plugin.createFromXaml("<Canvas Name='"+ this.id +"'> </Canvas>", false);
            
            // Add tranforms to overviewBox Canvas
            this.box.renderTransform = plugin.createFromXaml("<TransformGroup><RotateTransform/></TransformGroup>");			
            this.layer.Children.Add(this.box);
            
            // Main box - rectangle
            this.outerBox = plugin.createFromXaml("<Rectangle StrokeThickness='1'></Rectangle>", false);
            // mod BP 2010
            this.outerBox.addEventListener("MouseLeftButtonDown", "activateBox");
            // end mod BP 2010
            this.box.Children.Add(this.outerBox);
            
            // Bottom line
            this.bottom = plugin.createFromXaml("<Line StrokeThickness='1'> </Line>", false);
            // mod BP 2010
            this.bottom.addEventListener("MouseLeftButtonDown", "activateBox");
            // end mod BP 2010
            this.box.Children.add(this.bottom);
            if (this.rotatable) {
                this.rotater = plugin.createFromXaml("<Ellipse StrokeThickness='1'> </Ellipse>", false);
                this.box.Children.add(this.rotater);
                
                this.rotater["Width"] = this.CORNER_WIDTH;
                this.rotater["Height"] = this.CORNER_WIDTH;               
                this.rotater["Fill"] = "white";
                // mod BP 2010
                this.rotater.addEventListener("MouseLeftButtonDown", "startRotating"); 
                // end mod BP 2010
                // Display custom cursor when mouse hovers over
                this.rotater.addEventListener("MouseEnter", "setRotateCustomCursor");
                this.rotater.addEventListener("MouseLeave", "resetCustomCursor");
            }
            if (this.resizable) {
                // Resizers - rectangles
                this.resizers = new Array();
                for (var i = 0; i < 4; i++) {
                    this.resizers[i] = plugin.createFromXaml("<Rectangle StrokeThickness='1'></Rectangle>", false);
                    this.box.Children.add(this.resizers[i]);
                    this.resizers[i]["Width"] = this.CORNER_WIDTH;
                    this.resizers[i]["Height"] = this.CORNER_WIDTH;
                    this.resizers[i]["Fill"] = "white";    
                    // mod BP 2010
                    this.resizers[i].addEventListener("MouseLeftButtonDown", "startResizing");  
                   
                    // Display custom cursor when mouse hovers over
                    this.resizers[i].addEventListener("MouseEnter", "setResizeCustomCursor");
                    this.resizers[i].addEventListener("MouseLeave", "resetCustomCursor");          	                	       
                }
            }
            if (this.panable) {
                //Center box - rectangle
                this.boxCenter = plugin.createFromXaml("<Rectangle StrokeThickness='1'> </Rectangle>", false);
                this.box.Children.add(this.boxCenter);
            
                this.boxCenter["Width"] = this.CORNER_WIDTH;
                this.boxCenter["Height"] = this.CORNER_WIDTH;
                this.boxCenter["Fill"] = "white";
                // mod BP 2010
                this.boxCenter.addEventListener("MouseLeftButtonDown", "startMoving");
                // Display custom cursor when mouse hovers over
                this.boxCenter.addEventListener("MouseEnter", "setDragCustomCursor");
                this.boxCenter.addEventListener("MouseLeave", "resetCustomCursor");
                // end mod BP 2010
                            				                
                // Center horizontal line
                this.hCenter = plugin.createFromXaml("<Line StrokeThickness='1'> </Line>", false);
                this.box.Children.add(this.hCenter);
                // mod BP 2010
                this.hCenter.addEventListener("MouseLeftButtonDown", "startMoving");
                // Display custom cursor when mouse hovers over
                this.hCenter.addEventListener("MouseEnter", "setDragCustomCursor");
                this.hCenter.addEventListener("MouseLeave", "resetCustomCursor");
                // end mod BP 2010        
                // Center vertical line
                this.vCenter = plugin.createFromXaml("<Line StrokeThickness='1'> </Line>", false);
                this.box.Children.add(this.vCenter);	
                // mod BP 2010
                this.vCenter.addEventListener("MouseLeftButtonDown", "startMoving");
                // Display custom cursor when mouse hovers over
                this.vCenter.addEventListener("MouseEnter", "setDragCustomCursor");
                this.vCenter.addEventListener("MouseLeave", "resetCustomCursor");       
                // end mod BP 2010
            }	
            // Move it to the top
            this.setZIndex(100);
            // Set the frame color
            if (this.bIsActive) {
                this.setColor("red");
            } else {
                this.setColor("silver");
            }
            // Set size and position of the box
            this.repaint();
        }
	},
		
    setColor: function(color){
        var n = this.box.children.count;
        for(i=0;i<n;i++){
            this.box.children.getItem(i).Stroke = color;
        }
	},
	
	
    repaint: function() {
        var halfBox = this.CORNER_WIDTH / 2;
        var halfWidth = this.width/2;
        var halfHeight = this.height/2;
        this.outerBox["Width"] = this.width;
        this.outerBox["Height"] = this.height;
        this.outerBox["Canvas.Left"] = -halfWidth;
        this.outerBox["Canvas.Top"] = -halfHeight;
        this.bottom["X1"] = -halfWidth;
        this.bottom["X2"] = halfWidth;
        this.bottom["Y1"] = halfHeight - halfBox;
        this.bottom["Y2"] = halfHeight - halfBox;
        if (this.rotatable) {
            this.rotater["Canvas.Left"] = -halfBox;
            this.rotater["Canvas.Top"] = - (halfHeight * 0.6) - halfBox;           
        }
        if (this.resizable) {           
            this.resizers[0]["Canvas.Left"] = -halfWidth - halfBox;
            this.resizers[0]["Canvas.Top"] =  -halfBox;
            this.resizers[1]["Canvas.Left"] = -halfBox;
            this.resizers[1]["Canvas.Top"] = -halfHeight - halfBox;
            this.resizers[2]["Canvas.Left"] = halfWidth - halfBox;
            this.resizers[2]["Canvas.Top"] = -halfBox;
            this.resizers[3]["Canvas.Left"] = -halfBox;
            this.resizers[3]["Canvas.Top"] = halfHeight - halfBox;
        }
        if (this.panable) {           
            this.boxCenter["Canvas.Left"] =  - halfBox;
            this.boxCenter["Canvas.Top"] =  - halfBox;
            this.hCenter["X1"] = - this.CORNER_WIDTH;
            this.hCenter["X2"] =  this.CORNER_WIDTH;
            this.hCenter["Y1"] = 0;
            this.hCenter["Y2"] = 0;
            this.vCenter["X1"] = 0;
            this.vCenter["X2"] = 0;
            if(this.rotatable){
                this.vCenter["Y1"] = -(0.6 * halfHeight) + (this.CORNER_WIDTH/2);
            }else {
                this.vCenter["Y1"] = -this.CORNER_WIDTH;
            }
            this.vCenter["Y2"] = this.CORNER_WIDTH;
        }
	
	},

    /**
     *   Hides the center of this box
     */   
    hideCenter : function(hide) {
        if(this.panable){
            if(hide){
                this.box.children.remove(this.boxCenter);
                this.box.children.remove(this.hCenter);
                this.box.children.remove(this.vCenter);
            } else {               
                this.box.children.add(this.boxCenter);
                this.box.children.add(this.hCenter);
                this.box.children.add(this.vCenter);
            }
        }
	},
	
    hideBottomLine : function(hide) {
        if(hide){
            this.box.children.remove(this.bottom);
        } else {               
            this.box.children.add(this.bottom);
        }
	},
	
    hideDragBoxes : function(hide) {
        if(hide == this.dragBoxesHidden){
            return;
        } else {
            this.dragBoxesHidden = hide;
        }
	
        if(this.rotatable){
            if(hide) {
                this.box.children.remove(this.rotater);
            } else {
                this.box.children.add(this.rotater);
            }    
        }
        if(this.resizable){
            for(var i=0; i<4; i++){
                if(hide) {
                    this.box.children.remove(this.resizers[i]);
                } else {
                    this.box.children.add(this.resizers[i]);
                }
            }
        }        
	},
	
    /**
     * Sets the active state of this box. 
     * A box will be red if active and grey if inactive.
     */
    activate : function(active) {
        active = active != false;
        if (active != this.bIsActive) {
            this.bIsActive = active;
            if (this.bIsActive) {
                this.setColor("red");
            } else {
                this.setColor("black");
            }
        }
	},
	
    /** Sets the center. 
     * Can be called with one DynPoint parameter or with two numbers x and y.
     * @param ptCenter can be a DynPoint which defines the center. Then the second parameter is not used.
     * @param y a number which is the y coordinate of the center. 
     *        This is used when the first parameter is given as a number (the x coordinate) 
     */
    setCenter : function(ptCenter, y) {
        if (ptCenter.isDynPoint) {
            this.center = ptCenter;
        } else {
            this.center.moveTo(ptCenter, y);
        }
        this.box["Canvas.Left"] = this.center.getX();
        this.box["Canvas.Top"]  = this.center.getY();
	},
	
    /* Set sizes. */
	
    /* Sets the sizes (width, height) of the box.
     * In order to keep the center of the box we have to move the x, y coordinates 
     * of the upper left corner of the box. This is done by repainting the box. */
    setSize : function(width, height) {
        if (width && height) {
            this.width = width;
            this.height = height;
            try {
                this.repaint();
            } catch(ex) {}
        }
	},
    /* Sets the height of the box.
     * In order to keep the center of the box we have to move the x, y coordinates 
     * of the upper left corner of the box. This is done by repainting the box. */
    setHeight : function(height) {
        if (height) {
           this.setSize(this.getWidth(), height);
        }
	},
    /* Sets the width of the box.
    * In order to keep the center of the box we have to move the x, y coordinates 
    * of the upper left corner of the box. This is done by repainting the box. */
    setWidth : function(width) {
        if (width) {
            this.setSize(width, this.getHeight());
        }
	},
	
    /* Get position and sizes. */
	
    getCenter : function() {
        return this.center;
	},
    getHeight: function() {
        return this.height;
	},
    getWidth: function() {
        return this.width;
	},
	
    setRotation: function(rot) {
        if(rot != null){
            this.box.RenderTransform.Children.getItem(0).Angle = rot;
            this.rotation = rot;
        }
	},
	
    getRotation: function() {
        var rot = this.box.RenderTransform.Children.getItem(0).Angle;		
        return rot;
	},
	
    getZIndex : function() {
        return this.zIndex;
	},
    setZIndex : function(zIndex) {
        this.zIndex = zIndex;
        this.box["Canvas.ZIndex"] = zIndex;
	},
    /**
     * Starts the resizing process (mouse down).
     * The state will be set and the dragboxes will be hidden.
     */
    beginResizing : function(pt) { 
        this.firstMove = true;
        this.startWidth = this.width;
        this.startHeight = this.height;
        this.startDistance = pt.getLength();    
        this.hideDragBoxes(true);
    },       
    /**
     * Code to do resizing during the MouseMove event
     *
     */
	resize : function(pt) {
        if (this.firstMove) {
            this.beginResizing(pt);
            this.firstMove = false;
        } else {
            var distance = pt.getLength();
            var factor = distance/this.startDistance;
            this.setSize(this.startWidth*Math.abs(factor), this.startHeight*Math.abs(factor));       
        }    
    }, 
    /**
     * Ends the resizing of the box.
     */
    endResizing : function (pt) {        
        if (!this.firstMove) {
            var distance = pt.getLength();
            var factor = distance/this.startDistance;
            this.setSize(this.startWidth*Math.abs(factor), this.startHeight*Math.abs(factor));
        }
        this.hideDragBoxes(false);
	},
    /**
     * Starts the dragging (moving) process (mouse down).
     * The state will be set and the dragboxes will be hidden.
     */
    beginDragging : function(pt) {
        this.hideDragBoxes(true);
        this.setCenter(pt.x, pt.y);
    },   
    /**
     * Moving the box. The pt will be used as new center.
     */
    drag : function(pt) {        
        this.setCenter(pt.x, pt.y);
    },
    /**
     * Ends Dragging of the box
     *
     */
    endDragging : function(pt) {
        this.setCenter(pt.x, pt.y);
        this.hideDragBoxes(false);
    },
    /**
     * Starts the rotation process (mouse down).
     * The state will be set and the dragboxes will be hidden.
     */
    beginRotating : function(pt) {
        var angle = Math.round(Math.atan2(pt.x,pt.y)*(180/Math.PI));
        this.startRotation = -this.rotation-angle;
        this.hideDragBoxes(true);
    },
    /**
     * Moving the box. The pt will be used as new center.
     */
	rotate : function(pt) {
        this.setRotation(-Math.round(Math.atan2(pt.x,pt.y)*(180/Math.PI))-this.startRotation, false);       
	},
	
    endRotating : function(pt) {      
        this.setRotation(-Math.round(Math.atan2(pt.x,pt.y)*(180/Math.PI))-this.startRotation);
        this.hideDragBoxes(false);
    }  
};
	
/**
 * Activates the selected rotate box
 */
function activateBox(sender, eventArgs) {
    if(root.isBlocked()){
        return false;
    }
    eventArgs.Handled = true;
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    if(!box.activatable){
        return false;
		}
    activateRotateBox(box, false);
    handleMapMouseDown(box.layer, eventArgs);
};
	
	
/**
 * Starts the moving (dragging) of the box.
 */
function startMoving(sender, eventArgs) {
    if(root.isBlocked()){
        return false;
    }
    eventArgs.Handled = true;
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    box.isDragging = true;
    activateRotateBox(box, false);    
    handleMapMouseDown(box.layer, eventArgs);
		}
	
/**
 * Starts the resizing of the box.
 */
function startResizing(sender, eventArgs) {
    if(root.isBlocked()){
        return false;
    }
    eventArgs.Handled = true;
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    box.isResizing = true;
    activateRotateBox(box, false);    
    handleMapMouseDown(box.layer, eventArgs);
}
	
/**
 * This method is used by the rotate corners. It will start the 
 * rotation after activating the clicked box and setting the state.
 */
function startRotating(sender, eventArgs) {
    if(root.isBlocked()){
        return false;
    }
    eventArgs.Handled = true;
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    box.isRotating = true;
    activateRotateBox(box, false);    
    handleMapMouseDown(box.layer, eventArgs);
};
	
function mouseEnter(sender, eventArgs) {
    sender.Cursor = "Hand";
}
function mouseLeave(sender, eventArgs) {
    sender.Cursor = "Default";
}
	
/**
 * Set the custom cursor when mouse hovers
 * over the center handle of the rotate box
 */
 function setDragCustomCursor(sender, eventArgs) {
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    if (box.boxType == "plot" && PlotTool && PlotTool.isActive) {    
        PlotTool.map.setCursor("cursor_moveplotframe.png");
    } else if (box.boxType == "overview" && OverviewTool) {
        OverviewTool.map.setCursor("cursor_moveoverview.png");  
    }
};
	
/**
 * Set the custom cursor when mouse hovers
 * over any of the resizers of the rotate box
 */
function setResizeCustomCursor(sender, eventArgs) { 
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    if (box.boxType == "plot" && PlotTool && PlotTool.isActive) {
        PlotTool.map.setCursor("cursor_resize.png");
    } else if (box.boxType == "overview" && OverviewTool) {
        OverviewTool.map.setCursor("cursor_resize.png");  
    }
};   
/**
 * Set the custom cursor when mouse hovers
 * over the rotate handle of the rotate box
 */
function setRotateCustomCursor(sender, eventArgs) {    
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    if (box.boxType == "plot" && PlotTool && PlotTool.isActive) {
       PlotTool.map.setCursor("cursor_rotate.png");
    }  
};
/**
 * Reset the custom cursor when mouse leaves any of
 * the handles of the rotate box
 */
function resetCustomCursor(sender, eventArgs) {
    var boxId = sender.getParent().Name;
    var box = root.getObject(boxId);
    if(!box.isResizing && !box.isDragging && !box.isRotating) {
        if (box.boxType == "plot" && PlotTool && PlotTool.isActive) {        
            PlotTool.map.setCursor("Default");
        } else if (box.boxType == "overview" && OverviewTool) {
            OverviewTool.map.setCursor("cursor_newoverview.png");
		}
	}
};

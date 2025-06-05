/** The kings moves implement side bars on the map for panning. */

var kingsmove_btn_size = 9;
var kingsmoves = new Array();

/* Event handler for kings moves.  */

/** Handles the event MouseEnter. */
function kingsmoveMouseEnter(sender, mouseEventArgs) {
	if(!root.isBlocked()){
		// Set color rgb(153, 153, 153), opacity, and show the image
	   	KingsMove.setAppearance(sender.Name, "#999999", 0.5, true);
    }
    return false;
}
/** Handles the event MouseLeave. */
function kingsmoveMouseLeave(sender, mouseEventArgs) {
	 if(!root.isBlocked()){
	 	// Set color rgb(153, 153, 153), opacity, and hide the image
	    KingsMove.setAppearance(sender.Name, "#999999", 0.25, false);
	 }
 	 return false;
}
/** Handles the event MouseLeftButtonDown. */
function kingsmoveMouseDown(sender, mouseButtonEventArgs) {
	 if(!root.isBlocked()){		 
		// Set color rgb(0, 0, 245), opacity, and hide the image
	    KingsMove.setAppearance(sender.Name, "#0000F5", 0.33, false);
    }
    return false;
}
/** Handles the event MouseLeftButtonUp and executes a kings move. */
function kingsmoveMouseUp(sender, mouseButtonEventArgs) {
	if(root.isBlocked()){
		return false;
	}
	KingsMove.setAppearance(sender.Name, "#999999", 0.5, true);
    return KingsMove.doKingsmove(sender.Name, mouseButtonEventArgs);
}

/**
 * Constructor for KingsMove.
 * A kingsmove should be constructed during onload.
 * @constructor
 */
KingsMove = function (mapId, dir, title) {
    this.id = mapId + "_km_" + dir;
    this.mapId = mapId;
    this.map = maps[mapId];
    this.direction = dir;
    this.title = title;
    this.layer = this.map.kingsmoves;
    
    // Create the side bar.
    // Use the "hand" cursor (except for browser Chrome) as in previous versions of SIAS client (required by issue CBG00134878).
    var xamlFragment = "<Rectangle Name='" + dir + "' ";
    if (!_Chrome()) {
    	xamlFragment += "Cursor='Hand' ";
	}
	xamlFragment += "/>";
    this.rect = this.map.silverlightContent.createFromXaml(xamlFragment, false);

    // Initialise color, opacity
    this.rect.Fill = "#999999";
    this.rect.Opacity = 0.25;
    
	// Initialise all sizes with kingsmove size
    this.rect.Width = kingsmove_btn_size;
    this.rect.Height = kingsmove_btn_size;
    
	// Corners get a border
    if (dir == "nw" || dir == "ne" || dir == "se" || dir == "sw") {
        this.rect.Stroke = "white";
    }
    
	// event handling
	this.rect.addEventListener("MouseLeftButtonDown", kingsmoveMouseDown);
	this.rect.addEventListener("MouseLeftButtonUp", kingsmoveMouseUp);
	this.rect.addEventListener("MouseEnter", kingsmoveMouseEnter);
	this.rect.addEventListener("MouseLeave", kingsmoveMouseLeave);
		
    // Create arrow image
	xamlFragment = "<Image Source='" + root.getURL() + "/modules/map/themes/xp/kingsmove_btn_" + this.direction + ".png' IsHitTestVisible='false' />";
    this.image = this.map.silverlightContent.createFromXaml(xamlFragment, false);
	this.image.Visibility = "Collapsed";
    this.image.Width  = kingsmove_btn_size;
    this.image.Height = kingsmove_btn_size;
    this.layer.Children.Add(this.rect);
    this.layer.Children.Add(this.image);
    return this;
};

KingsMove.doKingsmove = function (dir, mouseButtonEventArgs) {
	var km = kingsmoves["_" + dir];
    return Map.getMap(km.mapId).doKingsMove(km.mapId, km.direction, mouseButtonEventArgs);
};
	 
KingsMove.setAppearance = function (dir, color, opacity, showImage) {
	var km = kingsmoves["_" + dir];
    km.rect.Fill = color;
    km.rect.Opacity = opacity;
    if (km.image) {
	    if (showImage) {
	        var x = parseInt(km.rect["Canvas.Left"]) + parseInt((km.rect.Width  - kingsmove_btn_size) / 2);
	        var y = parseInt(km.rect["Canvas.Top"])  + parseInt((km.rect.Height - kingsmove_btn_size) / 2);
	        km.image["Canvas.Left"] = x;
	        km.image["Canvas.Top"] = y;
			km.image.Visibility = "Visible";
	    } else {
	        km.image.Visibility = "Collapsed";
	    }
    }
};

/**
 * Set the positions and lengths of the kings move bars and corners.
 */
function refreshKingsMoveArrows(clientId) {
	// Get sizes of map
	var height = Map.getMap(clientId).getHeight();
	var width  = Map.getMap(clientId).getWidth();
	
	// Reset the lengths of the kings move bars
	var dHeight = Math.max(height - kingsmove_btn_size * 2, 0);
	clientId = ""; // Prefix clientId not used in the following
	kingsmoves[clientId + "_e"].rect.Height = dHeight;
	kingsmoves[clientId + "_w"].rect.Height = dHeight;
	var dWidth = Math.max(width - kingsmove_btn_size * 2, 0);
	kingsmoves[clientId + "_n"].rect.Width = dWidth;
	kingsmoves[clientId + "_s"].rect.Width = dWidth;
	
	// Set the position of all kingsmoves
    
    var btn;
	btn = kingsmoves[clientId + "_n"];
	btn.rect["Canvas.Left"] = kingsmove_btn_size;
	btn.rect["Canvas.Top"]  = 0;
	
	btn = kingsmoves[clientId + "_ne"];
	btn.rect["Canvas.Left"] = width - kingsmove_btn_size;
	btn.rect["Canvas.Top"]  = 0;
	
	btn = kingsmoves[clientId + "_e"];
	btn.rect["Canvas.Left"] = width - kingsmove_btn_size;
	btn.rect["Canvas.Top"]  = kingsmove_btn_size;
	
	btn = kingsmoves[clientId + "_se"];
	btn.rect["Canvas.Left"] = width - kingsmove_btn_size;
	btn.rect["Canvas.Top"]  = height - kingsmove_btn_size;
	
	btn = kingsmoves[clientId + "_s"];
	btn.rect["Canvas.Left"] = kingsmove_btn_size;
	btn.rect["Canvas.Top"]  = height - kingsmove_btn_size;
	
	btn = kingsmoves[clientId + "_sw"];
	btn.rect["Canvas.Left"] = 0;
	btn.rect["Canvas.Top"]  = height - kingsmove_btn_size;
	
	btn = kingsmoves[clientId + "_w"];
	btn.rect["Canvas.Left"] = 0;
	btn.rect["Canvas.Top"]  = kingsmove_btn_size;
	
	btn = kingsmoves[clientId + "_nw"];
	btn.rect["Canvas.Left"] = 0;
	btn.rect["Canvas.Top"]  = 0;
}

/* Management of tiles on a map */

/**
 * Constructor for a map tile. Creates a map tile in the DOM. Will only be used by the map tag.
 * @ignore
 */
MapTile = function (layer, transparent) {
	this.transparent = transparent=="true";
	this.createImage(layer);
	return this;
};

/**
 * @ignore
 */
MapTile.prototype = {
	url: "",
	justSet: true,
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	transparent: false,
	
	/* ===================== getters =============================*/
	/**
	 * Returns the url of a map tile.
     * @ignore
	 */
	getURL:function () {
	    return this.url;
	},
	/**
	 * Returns this x coordinate.
     * @ignore
	 */
	getX:function () {
	    return this.x;
	},
	/**
	 * Returns this y coordinate.
     * @ignore
	 */
	getY:function () {
	    return this.y;
	},
	/**
	 * Returns the width of the image.
	 * @ignore
	 */
	getWidth:function () {
		return this.width;
	},
	/**
	 * Returns the height of the image.
	 * @ignore
	 */
	getHeight:function () {
		return this.height;
	}
};

/**
 * Creates the image of the map tile as an XAML node and adds it to the parent node.
 */
MapTile.prototype.createImage = function (layer) {
	var plugin = layer.getHost();
    this.image = plugin.content.createFromXaml("<Image/>", false);
    layer.Children.Add(this.image);
};

/**
 * clear
 * @ignore
 */
MapTile.prototype.clear = function (layer) {
	if (this.image) {
		layer.Children.Remove(this.image);
		delete this.image;
	}
};
/**
 * Shows a map tile. Re-sets position and dimension and makes the map tile visible.
 * @ignore
 */
MapTile.prototype.show = function () {
    if (this.image != null) {
        this.setX(this.x);
        this.setY(this.y);
	    this.setWidth( this.width);
	    this.setHeight( this.height);
	    this.image.Visibility = "Visible";
    }
};
/**
 * Hides a map tile.
 * @ignore
 */
MapTile.prototype.hide = function () {
    if (this.image != null) {
    	this.image.Visibility = "Hidden";
    }
};
/**
 * Sets the URL of a map tile.
 * @ignore
 */
MapTile.prototype.setUrl = function (url) {
    if (this.url != url) {
        this.url = url;
        if (this.image != null) {
            this.image.Source = url;
        }
    }
    this.justSet = true;
};
/**
 * Sets the x coordinate of a map tile.
 * @ignore
 */
MapTile.prototype.setX = function (x) {
    this.x = x;
    if (this.image != null) {
        this.image["Canvas.Left"] = x;
    }
};
/**
 * Sets the y coordinate of a map tile.
 * @ignore
 */
MapTile.prototype.setY = function (y) {
    this.y = y;
    if (this.image != null) {
        this.image["Canvas.Top"] = y;
    }
};
/**
 * Sets the width of the image.
 * @ignore
 */
MapTile.prototype.setWidth = function (width) {
    this.width = width;
    if (this.image != null) {
        this.image.Width = width;
    }
};
/**
 * Sets the height of the image.
 * @ignore
 */
MapTile.prototype.setHeight = function (height) {
    this.height = height;
    if (this.image != null) {
        this.image.Height = height;
    }
};

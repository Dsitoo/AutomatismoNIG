/**
 *	ZIndexManager
 *
 *  20.07.04
 */
ZIndexManager = function() {
	// saves the zIndex of "normal" layers
	this.zIndexList = new Array();
	// saves the zIndex of always-on-top layers
	this.topZIndexList = new Array();
	this.maxZIndex = 0;
};

ZIndexManager.prototype = {
	/*
	 * Adds a Layer (normally a Window) to the manager. The layer's Y-Position
	 * is controlled by the manager until he is removed.
	 *
	 * @param lyr: Layer that is added to the manager
	 */
	addLayer : function(lyr) {
		var indexList = null
		// The right indexlist is chosen
		if (lyr.isAlwaysOnTop != null && lyr.isAlwaysOnTop()) {
			indexList = this.topZIndexList;
		} else {
			indexList = this.zIndexList;
		}
		indexList[indexList.length++] = lyr;		
		this.refreshZIndex();
	},
	
	getMaxZIndex : function() {
		return this.maxZIndex;
	},
	
	/*
	 * Shoves a layer into the foreground if the manager is responsibel for him.
	 *
	 * @param lyr: Layer that is shoved
	 */
	moveToFront : function(lyr) {
		var indexList = null;
		// The right indexlist is chosen
		if (lyr.isAlwaysOnTop != null && lyr.isAlwaysOnTop()) {
			indexList = this.topZIndexList;
		} else {
			indexList = this.zIndexList;
		}
		
		for (var lyrIndex in indexList) {
			if (lyr == indexList[lyrIndex]) {
				// old position is cleared
				removeFromArray(indexList, lyrIndex);
				break;
			}
		}		
		// the layer is put to the end of the indexlist -> highest position
		indexList[indexList.length++] = lyr;				
		this.refreshZIndex();
	},

	/*
	 * Shoves a layer into the background if the manager is responsibel for him.
	 *
	 * @param lyr: Layer that is shoved
	 */
	moveToBack : function(lyr) {
		var indexList = null;
		// The right indexlist is chosen
		if (lyr.isAlwaysOnTop != null && lyr.isAlwaysOnTop()) {
			indexList = this.topZIndexList;
		} else {
			indexList = this.zIndexList;
		}
		
		for (var lyrIndex in indexList) {
			if (lyr == indexList[lyrIndex]) {
				// old position is cleared
				removeFromArray(indexList, lyrIndex);
				break;
			}
		}
		// the layer is put to the beginning of the indexlist -> lowest position
		indexList.unshift(lyr);
		this.refreshZIndex();
	},
	
	/*
	 * refreshes the z-indexes of all controlled layers
	 */
	refreshZIndex : function() {
		// "real" z-index
		var z = 0;
		// first all normal layers get refreshed beginning in the back.
		for (var lyrIndex in this.zIndexList) {
			var lyr = this.zIndexList[lyrIndex];
			try {
				lyr.setZIndex(z++);
			} catch (ex) {}
		}
		// after that all always-on-top layers get refreshed beginning in the back again.
		for (var lyrIndex in this.topZIndexList) {
			var lyr = this.topZIndexList[lyrIndex];
			try {
				lyr.setZIndex(z++);
			} catch (ex) {}
		}
		this.maxZIndex = z+1;
	},
	
	/*
	 * Removes a layer from the manager. The layer's z-position is not controlled anymore.
	 *
	 * @param lyr: the layer that gets removed
	 */ 
	removeLayer : function(lyr) {
		var indexList = null
		// The right indexlist is chosen
		if (lyr.isAlwaysOnTop != null && lyr.isAlwaysOnTop()) {
			indexList = this.topZIndexList;
		} else {
			indexList = this.zIndexList;
		}
		for (var lyrIndex in indexList) {
			if (lyr == indexList[lyrIndex]) {
				// The layers position is cleared.				
				removeFromArray(indexList, lyrIndex);
				break;
			}
		}
	},
	
	/*
	 * Sets the layer always on top
	 *
	 * @param lyr: the layer that has to be set on top
	 * @bAlwaysOnTop: defines wether this sets or unsets the attribute. If this parameter is not set,
	 *                it is automatically true.
	 */
	setAlwaysOnTop : function(lyr, bAlwaysOnTop) {
		var oldZIndexList = null;
		var newZIndexList = null;
		var alreadyThere = false;
		if (bAlwaysOnTop == false) {
			oldZIndexList = this.topZIndexList;
			newZIndexList = this.zIndexList;
		} else {
			oldZIndexList = this.zIndexList;
			newZIndexList = this.topZIndexList;
		}
		
		for (var lyrIndex in oldZIndexList) {
			if (lyr == oldZIndexList[lyrIndex]) {				
				removeFromArray(oldZIndexList, lyrIndex);
				break;
			}
		}
		for (var lyrIndex in newZIndexList) {
			if (lyr == newZIndexList[lyrIndex]) {
				alreadyThere = true;
				break;
			}
		}
		if (!alreadyThere) {
			newZIndexList[newZIndexList.length++] = lyr;	
		}
		this.refreshZIndex();
	}
};
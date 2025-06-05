// BEGIN BP HM
// Help variable to store the id of the destop div element
// under which the Desktop object is registered to the root.
var desktopID;
// END BP HM
function initDesktop(clientId) {
	var desktop = new Desktop(clientId);
	// BEGIN BP HM
	desktopID = clientId;
	// END BP HM
	root.registerObject(desktop);
	return desktop;
}

Desktop = function(clientId) {
	this.id = clientId;
	root.registerObject(this);
	
	this.layer = document.getElementById(clientId);
	this.layer.desktop = this;
	// BEGIN BP HM
	// window.onresize replaces this.layer.onresize
	// because Firefox, Safari & Chrome doesn't implement
	// onresize event on div elements.
	// jQuery is used to ensure events browser independance
	$(window).resize (function() {
		// No size checks are longer implemented, therefore
		// simply resize the desktop window when this event occurs.
		window.setTimeout("root.getObject('" + desktopID + "').resize()", 200);

	});
	// END BP HM

	this.blocker = document.getElementById(clientId+"blocker");
	this.blocker.onmousedown = function(event) { return false; };
	this.blocker.onmouseup = function(event) { return false; };
	this.blocker.onmousemove = function(event) { return false; };
	this.blocker.onclick = function(event) { return false; };
	this.blocker.onkeydown = function(event) { return false; };
	this.blocker.onkeyup = function(event) { return false; };
	this.blocker.onkeypress = function(event) { return false; };
	this.blocker.oncontextmenu = function(event) { return false; };
	
	this.form = document.getElementById("form"+clientId);
	
	this.windows = new Array();
	this.iconifiedWindows = new Array();
	this.windowOrder = new Array();
	this.zIndexManager = new ZIndexManager();

	this.ghostLayer = document.getElementById(this.id+"ghost");
	this.ghostLayer.desktop = this;

	this.dragLayer = document.getElementById(this.id+"drag");
	this.dragLayer.desktop = this;
	this.dragLayer.onmousemove = function(event) {
		event = event || window.event;
		var jQueryEvent	= jQuery.event.fix( event );
		var offsetX;
		var offsetY;
		// Traverse the document with jquery to retrieve the event source
		var eventSrc = $(jQueryEvent.target);
		// Calculate the jquery offsets in the same way for all browsers	
		var deltaX = eventSrc.offset().left;
		var deltaY = eventSrc.offset().top;
		offsetX = jQueryEvent.pageX -  deltaX ;
		offsetY = jQueryEvent.pageY -  deltaY ;		
		this.desktop.handleMouseMove(offsetX, offsetY);
		return false;
	}
	this.dragLayer.onmouseup = function(event) {
		event = event || window.event;
		var jQueryEvent	= jQuery.event.fix( event );
		var offsetX;
		var offsetY;
		// Traverse the document with jquery to retrieve the event source
		var eventSrc = $(jQueryEvent.target);
		// Calculate the jquery offsets in the same way for all browsers	
		var deltaX = eventSrc.position().left;
		var deltaY = eventSrc.position().top;
		offsetX = jQueryEvent.pageX -  deltaX ;
		offsetY = jQueryEvent.pageY -  deltaY ;	
		this.desktop.handleMouseUp(offsetX, offsetY);
		return false;
	}
	
	this.startPoint = new DynPoint(0, 0);
	this.startBounds = new DynRect(0, 0, 0, 0);
	this.dragMode = this.DRAGMODE_OPAQUE;
	this.moveMode = this.MOVEMODE_NONE;
	
	this.layerWidth = this.layer.offsetWidth;
	this.layerHeight = this.layer.offsetHeight;
};

Desktop.prototype = {
	DRAGMODE_OPAQUE : 0,
	DRAGMODE_BORDER : 1,
	DEFAULT_ADD_WINDOW_SPACE : 20,
	DEFAULT_WINDOW_WIDTH : 400,
	DEFAULT_WINDOW_HEIGHT : 300,
	MIN_WINDOW_WIDTH : 150,
	MIN_WINDOW_HEIGHT : 100,
	ICON_SNAP_X : 250,
	MOVEMODE_NONE : 0,
	MOVEMODE_DRAG : 1,
	MOVEMODE_RESIZE : 2,
	SNAP_RANGE : 10,
	MIN_WAIT : 40, //at least wait 40ms between every mousemove-event. --> 25fps
	
	dragMode : this.DRAGMODE_BORDER,
	moveMode : this.MOVEMODE_NONE,
	activeWindow : null,
	dragged : false,
	iconifyToOldPosition : false,
	lastAddWindowPosition : 0,
	moved : false,
	resizeDirection : "",
	snapHorizontal : false,
	snapVertical : false,
	startPoint : null,
	startBounds : null,
	targetWindow : null,
	
	resizeTimeout : null,
	
	/*
	* Moves a window to the foreground and gives him the signal to be active
	*
	* Normally it is shown as the "active window"
	* the window that was active so far, now becomes inactive and moves to the background
	*
	* @param win: the window that gets activated
	*/
	activateWindow : function(win, fire) {
		win = win || null;
		if (this.activeWindow == win) {
			return;
		}

		if (this.activeWindow != null) {
			this.activeWindow.setFocused(false);
		}

		this.activeWindow = win;
		if (!win.isStandAlone()) {
			if (this.windowOrder.length == 0 || this.windowOrder[0] != win) {
				var order = new Array(win);
				removeFromArray(this.windowOrder, win);
				this.windowOrder = order.concat(this.windowOrder);
			}
	
			if (win.isFullScreen()) {
				this.moveToBack(win);
			} else {
				this.moveToFront(win);
			}
	
			win.setFocused(true);
			win.show();
			
			//tweak to disable autoscrolling
			try {
				// mod BP 2010
				var oldX = $(win.layer).css('left');
				var oldY = $(win.layer).css('top');
				$(win.layer).css({'left':0,'top':0});
				try {
					win.layer.focus();
				} catch (ex) { }
				
				$(win.layer).css({'left':oldX,'top':oldY});
				// end mod BP 2010

				// TODO 4moz: if the browser is mozilla the window-layer-size has to be reset on activate
			} catch (ex) { }
		}
//		if (fire != false) {
//			this.submitState();
//		}
	},

	/*
	 * This function adds a new window to the desktop.
	 * At this point the window has to be created for the first time.
	 *
	 * @param win: an instance of a Window that is added to the desktop
	 */
	addWindow : function(id, src, opened, title, left, top, width, height, state, resizable,
			iconifiable, maximizable, closeable, alwaysOnTopSetable, alwaysOnTop) {
		var win = null;
		width = width || this.DEFAULT_WINDOW_WIDTH;
		height = height || this.DEFAULT_WINDOW_HEIGHT;
		if (left == null || top == null) {
			this.lastAddWindowPosition += this.DEFAULT_ADD_WINDOW_SPACE;
			if (left == null && (this.lastAddWindowPosition + width >= parseInt(this.layer.offsetWidth))) {
				this.lastAddWindowPosition = 0;
			}
			if (top == null && (this.lastAddWindowPosition + height >= parseInt(this.layer.offsetHeight))) {
				this.lastAddWindowPosition = 0;
			}
			left = left || this.lastAddWindowPosition;
			top  = top  || this.lastAddWindowPosition;
		}
		if (this.windows[id] != null) {
			win = this.windows[id];
		} else {
			win = new Window(id, src, opened, title, left, top, width, height, state, resizable,
				iconifiable, maximizable, closeable, alwaysOnTopSetable, alwaysOnTop);
			this.windows[win.id] = win;
		}
		win.desktop = this;
		
		this.zIndexManager.addLayer(win);
		
		win.init();
		if (win.isFullScreen()) {
			win.setBounds(new DynRect(0, 0, this.layer.offsetWidth, this.layer.offsetHeight));
		} else {
			win.setBounds(win.getBounds());
		}
		if (opened) {
			this.activateWindow(win);
		}
		return win;
	},
	
	addStandAloneWindow : function(id, title, left, top, width, height, resizable) {
		//TODO
	},
	/**
	 * This function starts the dragging of a window.
	 * The endDragWindow(*)-function has to called afterwards. 
	 * 
	 * @param window The instance of an window which is to be dragged.
	 */
	 	beginDragWindow : function(window, event) {
		root.stamp = (new Date()).getTime();
		this.targetWindow = window;
		this.moveMode = this.MOVEMODE_DRAG;
		event = event || window.event;
		var jQueryEvent	= jQuery.event.fix( event );
		this.startPoint.moveTo(jQueryEvent.pageX, jQueryEvent.pageY);
		this.startBounds = window.getBounds();
		this.snapHorizontal = true;
		this.snapVertical =  true;
		// mod BP 2010
		$(this.dragLayer).css({'display':"block",'visibility':"visible",'cursor':"default"});
		// end mod BP 2010
		this.dragged = false;
	},
	/**
	 * This function starts the resizing of a window.
	 * The endResizeWindow(*)-function has to called afterwards.
	 * 
	 * @param window The instance of an window which is to be resized.
	 */
	beginResizeWindow : function(window, direction, event) {
		root.stamp = (new Date()).getTime();
		this.targetWindow = window;
		this.targetWindow.setResizing(true);
		this.moveMode = this.MOVEMODE_RESIZE;
		event = event || window.event;
		var jQueryEvent	= jQuery.event.fix( event );
		this.startPoint.moveTo(jQueryEvent.pageX, jQueryEvent.pageY);
		this.startBounds = window.getBounds();
		this.resizeDirection = direction;
		this.snapHorizontal = this.resizeDirection.startsWith("n") || this.resizeDirection.startsWith("s");
		this.snapVertical = this.resizeDirection.endsWith("w") || this.resizeDirection.endsWith("e");
		// mod BP 2010
		$(this.dragLayer).css({'display':"block",'visibility':"visible",'cursor': direction+"-resize"});
		// end mod BP 2010
		this.dragged = false;
	},
	/**
	 * This function will close a window.
	 *
	 * @param win The instance of a window to be closed.
	 */
	closeWindow : function(win, fire) {
		if (win == null) return;

		win.setClosed();
		this.iconifiedWindows[win.snappedCell] = false;
		// mod BP 2010
		$(this.blocker).css({'display':"none",'visibility':"hidden"});
		// end mod BP 2010
		root.blockObjects(false, this.getActiveWindow());
		
		if (fire != false) {
			this.submitState();
		}
	},
	/**
	 * This function drags a window.
	 */
	dragWindow : function(point) {
		var ptDelta = point.distanceTo(this.startPoint);
		var rect = this.startBounds.copy();
		rect.setLeft(this.startBounds.getLeft() + ptDelta.getX());
		rect.setTop(this.startBounds.getTop() + ptDelta.getY());

		rect = this._snap(this.targetWindow, rect);
		
		if (this.dragMode == this.DRAGMODE_OPAQUE) {
			this.targetWindow.setBounds(rect);
		} else if (this.dragMode == this.DRAGMODE_BORDER) {
			// mod BP 2010
			$(this.ghostLayer).css({'left': rect.getLeft(),'top': rect.getTop(),'width': rect.getWidth(),'height': rect.getHeight()});
			// end mod BP 2010
			if (!this.dragged) {
				// mod BP 2010
				$(this.ghostLayer).css({'visibility':"visible",'display': "block"});
				// end mod BP 2010
				this.targetWindow.hide();
				this.dragged = true;
			}
		}
	},
	/**
	 * This function ends the dragging of a window.
	 * It has to called after the beginDragWindow(*)-function.
	 *
	 * @param point The end point of the dragging.
	 */
	endDragWindow : function(point) {
		var ptDelta = point.distanceTo(this.startPoint);
		var rect = this.startBounds.copy();
		rect.setLeft(this.startBounds.getLeft() + ptDelta.getX());
		rect.setTop(this.startBounds.getTop() + ptDelta.getY());

		rect = this._snap(this.targetWindow, rect);
		
		this.targetWindow.setBounds(rect);
		// mod BP 2010
		$(this.dragLayer).css({'visibility':"hidden",'display':"none"});
		$(this.ghostLayer).css({'visibility':"hidden",'display':"none"});
		// end mod BP 2010
		this.targetWindow.show();
	},
	/**
	 * This function ends the resizing of a window.
	 * It has to called after the beginResizeWindow(*)-function.
	 *
	 * @param point The end point of the resizing.
	 */
	endResizeWindow : function(point) {
		var ptDelta = point.distanceTo(this.startPoint);
		var rect = this.startBounds.copy();

		if (this.resizeDirection.startsWith("n")) {
			rect.setHeight(Math.max(this.startBounds.getHeight() - ptDelta.getY(),
				this.MIN_WINDOW_HEIGHT));
			rect.setTop(Math.min(this.startBounds.getTop() + ptDelta.getY(),
				this.startBounds.getBottom() - this.MIN_WINDOW_HEIGHT));
		} else if (this.resizeDirection.startsWith("s")) {
			rect.setHeight(Math.max(this.startBounds.getHeight() + ptDelta.getY(),
				this.MIN_WINDOW_HEIGHT));
		}

		if (this.resizeDirection.endsWith("w")) {
			rect.setWidth(Math.max(this.startBounds.getWidth() - ptDelta.getX(),
				this.MIN_WINDOW_WIDTH));
			rect.setLeft(Math.min(this.startBounds.getLeft() + ptDelta.getX(),
				this.startBounds.getRight() - this.MIN_WINDOW_WIDTH));
		} else if (this.resizeDirection.endsWith("e")) {
			rect.setWidth(Math.max(this.startBounds.getWidth() + ptDelta.getX(),
				this.MIN_WINDOW_HEIGHT));
		}

		rect = this._snap(this.targetWindow,rect);
		
		this.targetWindow.setResizing(false);
		this.targetWindow.setBounds(rect);
		// mod BP 2010
		$(this.dragLayer).css({'visibility': "hidden",'display':"none"});
		$(this.ghostLayer).css({'visibility':"hidden",'display':"none"});
		// end mod BP 2010
		this.targetWindow.show();
	},
	/**
	 * This function returns the active window of a desktop.
	 *
	 * @return The active window.
	 */
	getActiveWindow : function() {
		return this.activeWindow;
	},
	/**
	 * This function handles the mouse move action on a desktop.
	 */
	handleMouseMove : function(x, y) {
		if ((new Date()).getTime() - root.stamp <= this.MIN_WAIT) return false;
		if (this.moveMode == this.MOVEMODE_RESIZE) {
			this.resizeWindow(new DynPoint(x, y));
		} else if (this.moveMode == this.MOVEMODE_DRAG) {
			this.dragWindow(new DynPoint(x, y));
		}
		root.stamp = (new Date()).getTime();
		return false;
	},
	/**
	 * This function handles the mouse up action on a desktop.
	 */
	handleMouseUp : function(x, y) {
		if (this.moveMode == this.MOVEMODE_RESIZE) {
			this.endResizeWindow(new DynPoint(x, y));
		} else if (this.moveMode == this.MOVEMODE_DRAG) {
			this.endDragWindow(new DynPoint(x, y));
		} else {
			// mod BP 2010
			$(this.dragLayer).css({'visibility':"hidden",'display': "none"});
			// end mod BP 2010
		}
		return false;
	},
	
	/*
	 * Iconifies the window.
	 * The window is put to the desktop as an icon or minimized to its titlebar.
	 * 
	 * @param win: the Window that gets iconified
	 * @param bActivate: sets if the window is activated after iconifying. Default: true
	 */
	iconifyWindow : function(win, fire) {
		if (win == null) {
			return;
		}
		if (!win.isIconified()) {
			win.setIconified();
			win.setBounds(
				new DynRect(
					0,
					parseInt(this.layer.offsetHeight)-parseInt(win.layer.offsetHeight),
					this.ICON_SNAP_X,
					parseInt(win.layer.offsetHeight))); 
			this._snapIconToGrid(win);
		}
		if (fire != false) {
			this.submitState();
		}
	},

	/*
	 * maximizes the window
	 * 
	 * @param win: the Window that gets maximized
	 */
	maximizeWindow : function(win, fire) {
		if (win == null) return;

		if (!win.isMaximized()) {
			win.setMaximized();
			win.setBounds(
				new DynRect(
					0, 0, parseInt(this.layer.offsetWidth), parseInt(this.layer.offsetHeight))); 
			this.iconifiedWindows[win.snappedCell] = false;
		}
		if (fire != false) {
			this.submitState();
		}
	},
	/**
	 * Moves a window to back of a desktop.
	 *
	 * @param win The instance of a window which is to be moved to the back.
	 */
	moveToBack : function(win) {
		this.zIndexManager.moveToBack(win);
	},
	/**
	 * Moves a window to front of a desktop.
	 *
	 * @param win The instance of a window which is to be moved to the front.
	 */
	moveToFront : function(win) {
		this.zIndexManager.moveToFront(win);
	},
	
	/*
	 * normalizes the window
	 * 
	 * @param win: the Window that gets normalized
	 */
	normalizeWindow : function(win, fire) {
		if (win == null) return;

		if (!win.isNormalized()) {
			win.setNormalized();
			win.setBounds(win.getNormalBounds());
			this.iconifiedWindows[win.snappedCell] = false;
		}
		if (fire != false) {
			this.submitState();
		}
	},
	/**
	 * This function opens a window.
	 *
	 * @param win The instance of a window to be opend.
	 */
	 openWindow : function(win, fire) {
		if (win != null) {
			win.show();
			if (win.isIconified()) {
				win.restore();
				win.setBounds(win.getNormalBounds());
			}
			this.activateWindow(win);
			if (win.isModal()) {
				// mod BP 2010
				$(this.blocker).css({'display':"block",'visibility':"visible",'zIndex': $(win.layer).css('zIndex')-1});
				// end mod BP 2010
				root.blockObjects(true, this.getActiveWindow());
			}
		}
		if (fire != false) {
			this.submitState();
		}
	},
	/**
	 * resize
	 */
	resize : function() {
		// mod BP 2010
		var w_width;
		var w_height;
		// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
		if (typeof window.innerWidth != 'undefined') {
			w_width  = window.innerWidth;
			w_height = window.innerHeight;			 
		// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
		} else if (typeof document.documentElement != 'undefined'
			     && typeof document.documentElement.clientWidth !=
			     'undefined' && document.documentElement.clientWidth != 0) {
		 	w_width  = document.documentElement.clientWidth;
		 	w_height = document.documentElement.clientHeight;
	    } else if (typeof document.body.clientWidth != 'undefined'
			 	 && typeof document.body.clientWidth !=
			 	 'undefined' && document.body.clientWidth != 0) {
			w_width  = document.body.clientWidth;
			w_height = document.body.clientHeight;
		};
		
		if (this.layerWidth != w_width || this.layerHeight != w_height) {
			this.layerWidth  = w_width;
			this.layerHeight = w_height;
			if (this.resizeTimeout != null) {
				window.clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = window.setTimeout(
					"root.getObject('"+this.id+"').resize()",1000);
		} else {
			for (var winName in this.windows) {
				var win = this.windows[winName];
				if (win.isVisible()) {
					if (win.isMaximized() || win.isFullScreen()) {
						 win.setBounds(new DynRect(0,0,w_width, w_height));
					}
				}
			}
		}
		// end mod BP 2010
	},
	/**
	 * resize a window
	 */
	resizeWindow : function(point) {
		var ptDelta = point.distanceTo(this.startPoint);
		var rect = this.startBounds.copy();

		if (this.resizeDirection.startsWith("n")) {
			rect.setHeight(Math.max(this.startBounds.getHeight() - ptDelta.getY(),
				this.MIN_WINDOW_HEIGHT));
			rect.setTop(Math.min(this.startBounds.getTop() + ptDelta.getY(),
				this.startBounds.getBottom() - this.MIN_WINDOW_HEIGHT));
		} else if (this.resizeDirection.startsWith("s")) {
			rect.setHeight(Math.max(this.startBounds.getHeight() + ptDelta.getY(),
				this.MIN_WINDOW_HEIGHT));
		}

		if (this.resizeDirection.endsWith("w")) {
			rect.setWidth(Math.max(this.startBounds.getWidth() - ptDelta.getX(),
				this.MIN_WINDOW_WIDTH));
			rect.setLeft(Math.min(this.startBounds.getLeft() + ptDelta.getX(),
				this.startBounds.getRight() - this.MIN_WINDOW_WIDTH));
		} else if (this.resizeDirection.endsWith("e")) {
			rect.setWidth(Math.max(this.startBounds.getWidth() + ptDelta.getX(),
				this.MIN_WINDOW_HEIGHT));
		}

		rect = this._snap(this.targetWindow,rect);
		
		if (this.dragMode == this.DRAGMODE_OPAQUE) {
			this.targetWindow.setBounds(rect);
		} else if (this.dragMode == this.DRAGMODE_BORDER) {
			// mod BP 2010
			$(this.ghostLayer).css({'left': rect.getLeft(),'top':rect.getTop(),'width':rect.getWidth(),'height':rect.getHeight()});
			// end mod BP 2010
			if (!this.dragged) {
				// mod BP 2010
				$(this.ghostLayer).css({'visibility':"visible",'display':"block"});
				// end mod BP 2010
				this.targetWindow.hide();
				this.dragged = true;
			}
		}
	},
	/**
	 * set drag mode
	 */
	setDragMode : function(mode) {
		if (mode != null) {
			this.dragMode = mode;
		}
	},
	/**
	 * This function sets a window to a full screen size.
	 *
	 * @param win The instance of a window to be resized.
	 */
	setWindowToFullScreen : function(win, fire) {
		if (win == null) return;

		if (!win.isFullScreen()) {
			win.setToFullScreen();
			win.setBounds(
				new DynRect(
					0, 0, parseInt(this.layer.offsetWidth), parseInt(this.layer.offsetHeight))); 
			this.iconifiedWindows[win.snappedCell] = false;
			win.init();
			this.moveToBack(win);
		}
		
		if (fire != false) {
			this.submitState();
		}
	},
	/**
	 * submits the state
	 */
	submitState : function() {
		var state = "";
		var first = true;
		root.setServerBlocker();
		for (var winId in this.windows) {
			if (first) {
				first = false;
			} else {
				state += "##";
			}
			state += this.windows[winId].toString();
		}
		document.getElementById(this.id + "state").value = state;
		this.form.submit();
	},

	/**
	 * this very private function tries to find the best snapable position from rect
	 * win is the excluded window
	 * as we only snap corresponding edges we take only combinations left-right & top-bottom
	 *
	 * @param win: the Window that is excluded from the search (the snapping window itself)
	 * @param rect: the bounds that should be snapped to another window
	 */
	_snap : function(win,rect) {
		var minSnapDeltaX = this.SNAP_RANGE;
		var minSnapDeltaY = this.SNAP_RANGE;
		var bounds = new DynRect();
		for (var winName in this.windows) {
			var snapWin = this.windows[winName];
			if (snapWin != null 
				&& win != snapWin 
				&& snapWin.isVisible()
				&& snapWin.isNormalized()) {
				var hSnapped = false;
				var vSnapped = false;
				bounds = snapWin.getBounds();

				//do the vertical snapping
				if (this.snapVertical && rect.getTop() <= (bounds.getBottom() + this.SNAP_RANGE)
					&& rect.getBottom() >= (bounds.getTop() - this.SNAP_RANGE)) {
					if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.endsWith("w")) {
						if (Math.abs(rect.getLeft() - bounds.getRight()) <= minSnapDeltaX) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setWidth(rect.getRight() - bounds.getRight());
							}
							rect.setLeft(bounds.getRight());
							minSnapDeltaX = Math.abs(rect.getLeft() - bounds.getRight());
							vSnapped = true;
						}
						if (Math.abs(rect.getLeft() - bounds.getLeft()) <= minSnapDeltaX) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setWidth(rect.getRight() - bounds.getLeft());
							}
							rect.setLeft(bounds.getLeft());
							minSnapDeltaX = Math.abs(rect.getLeft() - bounds.getLeft());
							vSnapped = true;
						}
					}
					if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.endsWith("e")) {
						if (Math.abs(rect.getRight() - bounds.getLeft()) <= minSnapDeltaX) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setWidth(bounds.getLeft() - rect.getLeft());
							} else {
								rect.setRight(bounds.getLeft());
							}
							minSnapDeltaX = Math.abs(rect.getRight() - bounds.getLeft());
							vSnapped = true;
						}
						if (Math.abs(rect.getRight() - bounds.getRight()) <= minSnapDeltaX) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setWidth(bounds.getRight() - rect.getLeft());
							} else {
								rect.setRight(bounds.getRight());
							}
							minSnapDeltaX = Math.abs(rect.getRight() - bounds.getRight());
							vSnapped = true;
						}
					}
				}

				//do the horizontal snapping
				if (this.snapHorizontal && rect.getLeft() <= (bounds.getRight() + this.SNAP_RANGE)
					&& rect.getRight() >= (bounds.getLeft() - this.SNAP_RANGE)) {
					if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.startsWith("n")) {
						if (Math.abs(rect.getTop() - bounds.getBottom()) <= minSnapDeltaY) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setHeight(rect.getBottom() - bounds.getBottom());
								rect.setTop(bounds.getBottom());
							} else {
								rect.setTop(bounds.getBottom());
							}
							minSnapDeltaY = Math.abs(rect.getTop() - bounds.getBottom());
							hSnapped = true;
						}
						if (Math.abs(rect.getTop() - bounds.getTop()) <= minSnapDeltaY) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setHeight(rect.getBottom() - bounds.getTop());
								rect.setTop(bounds.getTop());
							} else {
								rect.setTop(bounds.getTop());
							}
							minSnapDeltaY = Math.abs(rect.getTop() - bounds.getTop());
							hSnapped = true;
						}
					}
					if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.startsWith("s")) {
						if (Math.abs(rect.getBottom() - bounds.getTop()) <= minSnapDeltaY) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setHeight(bounds.getTop() - rect.getTop());
							} else {
								rect.setBottom(bounds.getTop());
							}
							minSnapDeltaY = Math.abs(rect.getBottom() - bounds.getTop());
							hSnapped = true;
						}
						if (Math.abs(rect.getBottom() - bounds.getBottom()) <= minSnapDeltaY) {
							if (this.moveMode == this.MOVEMODE_RESIZE) {
								rect.setHeight(bounds.getBottom() - rect.getTop());
							} else {
								rect.setBottom(bounds.getBottom());
							}
							minSnapDeltaY = Math.abs(rect.getBottom() - bounds.getBottom());
							hSnapped = true;
						}
					}
				}
			}
		}

		//snap to desktop borders
		var desktopWidth = parseInt(this.layer.offsetWidth);
		var desktopHeight = parseInt(this.layer.offsetHeight);
		if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.startsWith("w")) {
			if (Math.abs(rect.getLeft()) <= minSnapDeltaX) {
				if (this.moveMode == this.MOVEMODE_RESIZE) {
					rect.setWidth(rect.getRight());
				}
				rect.setLeft(0);
				minSnapDeltaX = Math.abs(rect.getLeft());
			}
		}
		if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.startsWith("e")) {
			if (Math.abs(rect.getRight() - desktopWidth) <= minSnapDeltaX) {
				if (this.moveMode == this.MOVEMODE_RESIZE) {
						rect.setWidth(desktopWidth - rect.getLeft());
				} else {
					rect.setRight(desktopWidth);
				}
				minSnapDeltaX = Math.abs(rect.getRight() - desktopWidth);
			}
		}

		if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.endsWith("n")) {
			if (Math.abs(rect.getTop()) <= minSnapDeltaY) {
				if (this.moveMode == this.MOVEMODE_RESIZE) {
					rect.setHeight(rect.getBottom());
				}
				rect.setTop(0);
				minSnapDeltaY = Math.abs(rect.getTop());
			}
		}
		if (this.moveMode != this.MOVEMODE_RESIZE || this.resizeDirection.endsWith("s")) {
			if (Math.abs(rect.getBottom() - desktopHeight) <= minSnapDeltaY) {
				if (this.moveMode == this.MOVEMODE_RESIZE) {
					rect.setHeight(desktopHeight - rect.getTop());
				} else {
					rect.setBottom(desktopHeight);
				}
				minSnapDeltaY = Math.abs(rect.getBottom() - desktopHeight);
				hSnapped = true;
			}
		}
		
		return rect;
	},
	
	/*
	 * Lets all iconified windows snap to a invisible grid on the desktop
	 */
	_snapAllIconsToGrid : function() {
		this.iconifiedWindows = new Array();
		for (var winIndex in this.windows) {
			var win = this.windows[winIndex];
			if (win.isIconified() && win.isVisible()) {
				this._snapIconToGrid(win);
			}
		}
	},
	
	/*
	 * Snaps an iconified window to the next free gridposition on the desktop.
	 * 
	 * @param win: the iconified Window that has to be snapped.
	 */
	_snapIconToGrid : function(win) {
		var desktopWidth = parseInt(this.layer.offsetWidth);
		var desktopHeight = parseInt(this.layer.offsetHeight);
		var bounds = win.getBounds();
		var symbolsPerRow = Math.floor(desktopWidth/this.ICON_SNAP_X);
		var symbolsPerCol = Math.floor(desktopHeight/bounds.getHeight());
		var xPos = 0;
		var yPos = 0;
		if (this.iconifyToOldPosition && win.snappedCell > -1) {
			xPos = win.snappedCell%symbolsPerRow;
			yPos = Math.floor(win.snappedCell/symbolsPerRow);
		} else {
			win.snappedCell = -1;
			xPos = Math.min(symbolsPerRow, Math.round(bounds.getLeft()/this.ICON_SNAP_X));
			yPos = Math.min(symbolsPerCol, Math.round((desktopHeight - bounds.getBottom())/bounds.getHeight()));
		}
		if (this.iconifiedWindows[xPos+yPos*symbolsPerRow]) {
			for (cell = yPos*symbolsPerRow+xPos+1; cell <= symbolsPerRow*symbolsPerCol; cell++) {
				xPos = cell%symbolsPerRow;
				yPos = Math.floor(cell/symbolsPerRow);
				if (!this.iconifiedWindows[xPos+yPos*symbolsPerRow]) {
					break;
				}
			}
		}
		this.iconifiedWindows[xPos+yPos*symbolsPerRow] = true;
		win.snappedCell = xPos+yPos*symbolsPerRow;
		bounds.setLeft(xPos * this.ICON_SNAP_X);
		bounds.setBottom(desktopHeight - yPos * bounds.getHeight());
		win.setBounds(bounds);
	}
};
/**
 * provides a window on a desktop
 */
Window = function(id, src, visible, title, left, top, width, height, state, resizable,
			iconifiable, maximizable, closeable, alwaysOnTopSetable, alwaysOnTop) {
	this.id = id;
	root.registerObject(this);

	this.layer = document.getElementById(this.id+"layer");
	this.layer.win = this;
	this.iFrameLayer = document.getElementById(this.id+"iframelayer");
	this.desktop = null;

//	this.src = src;
	this.setSrc(src);
	
	this.visible = visible;
	this.title = title || id;
	this.normalBounds = new DynRect(left||0, top||0, width||400, height||300);
	this.bounds = this.normalBounds;
	this.alwaysOnTop = alwaysOnTop || false;
	this.snappedCell = -1;

	this.resizable = resizable;
	this.state = state;
	this.formerState = state;
	this.previousState = state;
	this.closeable = closeable;
	this.iconifiable = iconifiable;
	this.maximizable = maximizable;
	this.focused = false;
	
	this.setBounds(this.normalBounds);
	
	return this;	
};

Window.prototype = {
	desktop : null,
	middleRow : null,
	bottomRow : null,
	closeButton : null,
	contentCell : null,
	contentLayer : null,
	iconifyButton : null,
	maximizeButton : null,
	iconSource : null,
	normalizeButton : null,
	placeHolder : null,
	resizing : false,
	snappedCell : 0,
	titleBar : null,
	titleIcon : null,
	visible : true,
	/**
	 * activates a window
	 */
	activate : function() {
		this.desktop.activateWindow(this, false);
	},
	/**
	 * close a a window
	 */
	close : function() {
		this.desktop.closeWindow(this, false);
	},
	/**
	 * returns the bounds of a window
	 */
	getBounds : function() {
		return this.bounds;
	},
	/**
	 * returns the bounds of a window
	 */
	getNormalBounds : function() {
		return this.normalBounds;
	},
	handleBlockEvent : function(event) {
		// The argument "event" is no longer used, because Silverlight does not provide it.
			this.layer.className = "window_active";
	},
	/**
	 * hides a window
	 */
	hide : function() {
		// mod BP 2010
		$(this.layer).css({'visibilty':"hidden",'display':"none"});
		$(this.iFrameLayer).css({'visibility':"hidden",'display':"none"});
		// end mod BP 2010
		this.visible = false;
	},
	/**
	 * inits a window
	 */
	init : function() {
		if (!this.visible) {
			this.hide();
		}
		if (!this.isFullScreen()) {
			this.topRow = document.getElementById(this.id + "toprow");
			this.middleRow = document.getElementById(this.id + "middlerow");
			this.bottomRow = document.getElementById(this.id + "bottomrow");
			
			this.leftCol = document.getElementById(this.id + "leftcol");;
	
			this.contentCell = document.getElementById(this.id + "contentcell");
			this.contentLayer = document.getElementById(this.id + "content");
			
			this.placeHolder = document.getElementById(this.id + "placeholder");
			
			this.titleBar = document.getElementById(this.id + "titlebar");
			this.titleBar.win = this;
			this.titleBar.onmousedown = function(event) {
				event = event || window.event;
				if (!this.win.isMaximized()) {
					this.win.desktop.beginDragWindow(this.win, event);
				}
				return false;
			};
			this.titleBar.ondblclick = function(event) {
				event = event || window.event;
				if (this.win.isNormalized()) {
					this.win.desktop.maximizeWindow(this.win, event);
				} else {
					this.win.desktop.normalizeWindow(this.win, event);
				}
				return false;
			};
	
			this.titleIcon = document.getElementById(this.id + "titleicon");
	
			this.iconifyButton = document.getElementById(this.id + "iconify");
			this.iconifyButton.win = this;
			this.iconifyButton.onmouseover = function() {
				this.src = this.hoverSrc;
			};
			this.iconifyButton.onmouseout = function() {
				this.src = this.normalSrc;
			};
			this.iconifyButton.onmousedown = function() {
				this.src = this.pressedSrc;
				this.win.desktop.activateWindow(this.win);
			};
			this.iconifyButton.onmouseup = function() {
				this.src = this.hoverSrc;
				this.win.desktop.iconifyWindow(this.win);
			};
	
			this.normalizeButton = document.getElementById(this.id + "normalize");
			this.normalizeButton.win = this;
			this.normalizeButton.onmouseover = function() {
				this.src = this.hoverSrc;
			};
			this.normalizeButton.onmouseout = function() {
				this.src = this.normalSrc;
			};
			this.normalizeButton.onmousedown = function() {
				this.src = this.pressedSrc;
				this.win.desktop.normalizeWindow(this.win);
			};
			this.normalizeButton.onmouseup = function() {
				this.src = this.hoverSrc;
			};
	
			this.maximizeButton = document.getElementById(this.id + "maximize");
			this.maximizeButton.win = this;
			this.maximizeButton.onmouseover = function() {
				this.src = this.hoverSrc;
			};
			this.maximizeButton.onmouseout = function() {
				this.src = this.normalSrc;
			};
			this.maximizeButton.onmousedown = function() {
				this.src = this.pressedSrc;
				this.win.desktop.activateWindow(this.win);
			};
			this.maximizeButton.onmouseup = function() {
				this.src = this.hoverSrc;
				this.win.desktop.maximizeWindow(this.win);
			};
	
			this.closeButton = document.getElementById(this.id + "close");
			this.closeButton.win = this;
			this.closeButton.onmouseover = function() {
				this.src = this.hoverSrc;
			};
			this.closeButton.onmouseout = function() {
				this.src = this.normalSrc;
			};
			this.closeButton.onmousedown = function() {
				this.src = this.pressedSrc;
				this.win.desktop.activateWindow(this.win);
			};
			this.closeButton.onmouseup = function() {
				this.src = this.hoverSrc;
				this.win.desktop.closeWindow(this.win);
			};
			
			this.layer.win = this;
			this.layer.onmousedown = function() {
				this.win.desktop.activateWindow(this.win);
			}
			
			this.resizeAreas = new Array();
			
			this.resizeAreas["n"] = document.createElement("div");
			this.resizeAreas["nw1"] = document.createElement("div");
			this.resizeAreas["nw2"] = document.createElement("div");
			this.resizeAreas["w"] = document.createElement("div");
			this.resizeAreas["sw1"] = document.createElement("div");
			this.resizeAreas["sw2"] = document.createElement("div");
			this.resizeAreas["s"] = document.createElement("div");
			this.resizeAreas["se1"] = document.createElement("div");
			this.resizeAreas["se2"] = document.createElement("div");
			this.resizeAreas["e"] = document.createElement("div");
			this.resizeAreas["ne1"] = document.createElement("div");
			this.resizeAreas["ne2"] = document.createElement("div");
			
			for (var direction in this.resizeAreas) {
				var tempDirection = direction.length > 2 ? direction.substring(0,2) : direction;
				this.resizeAreas[direction].className = "window_resize_" + direction;
				// mod BP 2010
				$(this.resizeAreas[direction]).css({'position':"absolute"});
				// end mod BP 2010
				this.resizeAreas[direction].win = this;
				this.layer.appendChild(this.resizeAreas[direction]);
			}
			this.resizeAreas["n"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "n", event);
				return false;
			};
			this.resizeAreas["w"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "w", event);
				return false;
			};
			this.resizeAreas["s"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "s", event);
				return false;
			};
			this.resizeAreas["e"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "e", event);
				return false;
			};
			this.resizeAreas["nw1"].onmousedown = this.resizeAreas["nw2"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "nw", event);
				return false;
			};
			this.resizeAreas["ne1"].onmousedown = this.resizeAreas["ne2"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "ne", event);
				return false;
			};
			this.resizeAreas["sw1"].onmousedown = this.resizeAreas["sw2"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "sw", event);
				return false;
			};
			this.resizeAreas["se1"].onmousedown = this.resizeAreas["se2"].onmousedown = function(event) {
				event = event || window.event;
				this.win.desktop.beginResizeWindow(this.win, "se", event);
				return false;
			};
			
			this.setResizeAreaEnabled(this.isNormalized() && this.resizable);
	
			this.refreshButtons();
		}
	},
	
	isActive : function() {
		return this.desktop.getActiveWindow() == this;
	},
	
	isIconified : function()  {
		return this.state == this.STATE_ICONIFIED;
	},
	
	isFullScreen : function() {
		return this.state == this.STATE_FULLSCREEN;
	},
	
	isMaximized : function()  {
		return this.state == this.STATE_MAXIMIZED;
	},
	
	isModal : function()  {
		return this.state == this.STATE_MODAL;
	},
	
	isNormalized : function()  {
		return this.state == this.STATE_NORMALIZED;
	},
	
	isStandAlone : function() {
		return false;
	},
	
	isVisible : function() {
		return this.visible;
	},
	/**
	 * opens a window
	 */
	open : function() {
		this.desktop.openWindow(this, false);
	},
	/**
	 * refreshes the buttons in a window
	 */
	refreshButtons : function() {
		// mod BP 2010
		$(this.iconifyButton).css({'visibility':this.iconifiable && !this.isIconified() && !this.isModal() ? "visible" : "hidden",
				                   'display':this.iconifiable && !this.isIconified() && !this.isModal() ? "inline" : "none"});

		$(this.normalizeButton).css({'visibility':!this.isNormalized() && !this.isModal() ? "visible" : "hidden",
                                     'display':!this.isNormalized() && !this.isModal() ? "inline" : "none"});

		$(this.maximizeButton).css({'visibility':this.maximizable && !this.isMaximized() && !this.isModal() ? "visible" : "hidden",
                                    'display':this.maximizable && !this.isMaximized() && !this.isModal() ? "inline" : "none"});
		
		$(this.closeButton).css({'visibility':this.closeable ? "visible" : "hidden",
				                 'display':this.closeable ? "inline" : "none"});
		// end mod BP 2010
	},
	/**
	 * restores the former state of the window
	 */
	restore : function() {
		if (this.formerState == this.STATE_MAXIMIZED) {
			this.setMaximized();
		} else if (this.formerState == this.STATE_NORMALIZED) {
			this.setNormalized();
		} else if (this.formerState == this.STATE_FULLSCREEN) {
			this.setToFullScreen();
		}
	},
	/**
	 * sets the bounds of a window
	 */
	setBounds : function(rect) {
		if (rect != null && this.layer != null) {
			this.bounds = rect;
			if (this.isNormalized()) {
				this.normalBounds = rect;
			}
			// mod BP 2010
			$(this.layer).css({'left':rect.getLeft(),'top':rect.getTop(),'width':rect.getWidth(),'height':rect.getHeight()});
			$(this.iFrameLayer).css({'left':rect.getLeft(),'top':rect.getTop(),'width':rect.getWidth(),'height':rect.getHeight()});
			// end mod BP 2010
			
			
			if (this.contentLayer != null) {
				if (this.resizing) {
					// mod BP 2010
					$(this.contentLayer).css({'left':this.leftCol.offsetWidth+(this.contentCell.offsetWidth - this.contentLayer.offsetWidth) / 2,
							                  'top':this.topRow.offsetHeight+(this.contentCell.offsetHeight - this.contentLayer.offsetHeight) / 2});
					// end mod BP 2010
				}
			}
		}
	},
	/**
	 * closes a window
	 */
	setClosed : function() {
		// mod BP 2010
		$(this.layer).css({'visibility':"hidden",'display':"none"});
		$(this.iFrameLayer).css({'visibility':"hidden",'display':"none"});
		// end mod BP 2010
		this.visible = false;
	},
	/**
	 * sets a window in the iconified state
	 */
	setIconified : function() {
		var titleHeight = this.titleBar.offsetHeight;
		if (this.state != this.STATE_ICONIFIED) {
			this.formerState = this.state;
		}
		this.state = this.STATE_ICONIFIED;
		// mod BP 2010
		$(this.middleRow).css({'display':"none"});
		$(this.bottomRow).css({'display':"none"});
		this.setResizeAreaEnabled(false);
		this.refreshButtons();
		$(this.layer).css({'height': titleHeight});
		$(this.iFrameLayer).css({'height': titleHeight});
		// end mod BP 2010
	},
	
	/**
	 * sets focus on a window
	 */
	setFocused : function(focused) {
		if (this.isFullScreen()) return;
		
		focused = focused != false;
		if (focused) {
			this.layer.className = "window_active";
			// mod BP 2010
			$(this.layer).css({'position':"absolute"});
			// end mod BP 2010

			this.iconifyButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_act.gif";
			this.iconifyButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_act_hover.gif";
			this.iconifyButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_act_pressed.gif";
			this.iconifyButton.src = this.iconifyButton.normalSrc;

			this.normalizeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_act.gif";
			this.normalizeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_act_hover.gif";
			this.normalizeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_act_pressed.gif";
			this.normalizeButton.src = this.normalizeButton.normalSrc;

			this.maximizeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_act.gif";
			this.maximizeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_act_hover.gif";
			this.maximizeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_act_pressed.gif";
			this.maximizeButton.src = this.maximizeButton.normalSrc;

			this.closeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_act.gif";
			this.closeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_act_hover.gif";
			this.closeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_act_pressed.gif";
			this.closeButton.src = this.closeButton.normalSrc;
		} else {
			this.layer.className = "window_inactive";

			this.iconifyButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_inact.gif";
			this.iconifyButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_inact_hover.gif";
			this.iconifyButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_iconify_act_pressed.gif";
			this.iconifyButton.src = this.iconifyButton.normalSrc;

			this.normalizeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_inact.gif";
			this.normalizeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_inact_hover.gif";
			this.normalizeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_normalize_act_pressed.gif";
			this.normalizeButton.src = this.normalizeButton.normalSrc;

			this.maximizeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_inact.gif";
			this.maximizeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_inact_hover.gif";
			this.maximizeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_maximize_act_pressed.gif";
			this.maximizeButton.src = this.maximizeButton.normalSrc;

			this.closeButton.normalSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_inact.gif";
			this.closeButton.hoverSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_inact_hover.gif";
			this.closeButton.pressedSrc = "modules/desktop/themes/"+THEME_PATH+"/btn_close_act_pressed.gif";
			this.closeButton.src = this.closeButton.normalSrc;
		}
		this.refreshButtons();
	},
	/**
	 * sets a window in the maximized state
	 */
	setMaximized : function() {
		this.state = this.STATE_MAXIMIZED;
		// mod BP 2010
		$(this.middleRow).css({'display':""});
		$(this.bottomRow).css({'display':""});
		// end mod BP 2010
		this.setResizeAreaEnabled(false);
		this.refreshButtons();
	},
	/**
	 * sets a window in the normalized state
	 */
	setNormalized : function() {
		this.state = this.STATE_NORMALIZED;
		// mod BP 2010
		$(this.middleRow).css({'display':""});
		$(this.bottomRow).css({'display':""});
		// end mod BP 2010
		this.setResizeAreaEnabled(this.resizable);
		this.refreshButtons();
	},
	/**
	 * sets a window in the modal state
	 */
	setModal : function() {
		this.state = this.STATE_MODAL;
		// mod BP 2010
		$(this.middleRow).css({'display':""});
		$(this.bottomRow).css({'display':""});
		// end mod BP 2010
		this.setResizeAreaEnabled(false);
		this.refreshButtons();
	},
	
	/**
	 * allow a window to resize
	 */
	setResizeAreaEnabled : function(enabled) {
		visibility = enabled != false ? "visible" : "hidden";
		for (var e in this.resizeAreas) {
			// mod BP 2010
			$(this.resizeAreas[e]).css({'visibility':visibility});
			// end mod BP 2010
		}
	},
	/**
	 * resizes a window
	 */
	setResizing : function(resizing) {
		resizing = resizing != false;
		if (this.resizing == resizing) return;
		this.resizing = resizing;
		// mod BP 2010
		if (this.resizing) {
			
			$(this.placeHolder).css({'display':"block"});
			$(this.contentLayer).css({'position':"absolute",'width':this.contentLayer.offsetWidth,'height':this.contentLayer.offsetHeight});
		} else {
			$(this.contentLayer).css({'width':"100%",'height':"100%",'left':"0",'top':"0",'position':"relative"});
			$(this.placeHolder).css({'display':"none"});
		}
		// end mod BP 2010
	},
	/**
	 * sets the source of a window
	 */
	setSrc : function(src, forceLoad) {
		if (this.src != src || forceLoad == true) {
			this.src = src;
			document.getElementById(this.id+"iframe").src =
				this.src+"?stateTarget=" + this.id + "&autorequest=true";
			
		}
	},
	/**
	 * set the state of a window
	 */
	setState : function(state) {
		if (this.state != state) {
			if (state == this.STATE_NORMALIZED) {
				this.desktop.normalizeWindow(this, false);
			} else if (state == this.STATE_ICONIFIED) {
				this.desktop.iconifyWindow(this, false);
			} else if (state == this.STATE_MAXIMIZED) {
				this.desktop.maximizeWindow(this, false);
			} else if (state == this.STATE_FULLSCREEN) {
				this.desktop.setWindowToFullScreen(this, false);
			}
			this.state = state;
		}
	},
	/**
	 * sets a window to the fullscreen state
	 */
	setToFullScreen : function() {
		this.state = this.STATE_FULLSCREEN;
	},
	/**
	 * sets the z index of a window
	 */
	setZIndex : function(zIndex) {
		// mod BP 2010
		if (zIndex != null) {		
			$(this.layer).css({'zIndex':zIndex});
			$(this.contentLayer).css({'zIndex':zIndex-1});
		}
		// end mod BOP 2010
	},
	/**
	 * shows a window
	 */
	show : function() {
		// mod BP 2010
		$(this.layer).css({'visibility':"visible",'display':"block"});
		$(this.iFrameLayer).css({'visibility':"visible",'display':"block"});
		// end mod 2010
		this.visible = true;
	},
	/**
	 * returns the string value of a window
	 */
	toString : function() {
		var separator = "**";
		return this.id + separator
			+ this.bounds.getLeft() + separator
			+ this.bounds.getTop() + separator
			+ this.bounds.getWidth() + separator
			+ this.bounds.getHeight() + separator
			+ this.state + separator
			+ this.visible + separator
			+ this.isActive();
	}
};
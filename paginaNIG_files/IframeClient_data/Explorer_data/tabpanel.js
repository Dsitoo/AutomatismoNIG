/**
 * tab panel
 */
TabPanel = function (id) {
	this.id = id;
	this.tabs = new Array();
	this.activeTab = null;
	root.registerObject(this);
};
TabPanel.prototype = {	
	/**
	 * activates a tab
	 */
	activateTab:function(tabId) {
		var newTab = this.tabs[tabId];
		
		if (newTab != null) {
			if (this.activeTab != null) {
				// hide the former active tab
				this.activeTab.hide(newTab.src != null);
			}
			
			this.activeTab = newTab;

			// show the new active tab
			this.activeTab.show();
		}
	},
	/**
	 * adds a tab to the panel
	 */
	addTab : function(id, src) {
		this.tabs[id] = new Tab(id, this.id, src);
	},
	/**
	 * sets the url of a tab
	 */
	setSrc : function(tabId, src) {
		this.tabs[tabId].setSrc(src);
	}
};
/**
 * tab
 */
Tab = function(id, parentId, src) {
	this.id = id;
	root.registerObject(this);
	this.parentId = parentId;
	this.src = src;
};
Tab.prototype = {
	active : false,
	/**
	 * hides this tab
	 */
	hide : function(onlyButton) {
		this.active = false;
		if (this.src != null) {
			if (onlyButton != true) {
				// mod BP 2010
				$("#"+ this.parentId + "iframebox").css({'display':"none"});
				// end mod BP 2010
				document.getElementById(this.parentId + "iframe").src = "about:blank";
			}
		} else {
			// mod BP 2010
			$("#"+ this.id + "box").css({'display':"none"});
			// end mod BP 2010

		}
		
		/*
		 * When hiding a tab panel element,  all still open item lists are 
		 * collapsed to avoid  the rendering of  items originating from another tab.
		 */
		root.collapse();
		document.getElementById(this.id + "head").className = "tab_button_inactive";
	},
	/**
	 * sets the url of a tab
	 */
	setSrc : function(src) {
		this.src = src;
		if (this.active) {
			this.show();
		}
	},
	/**
	 * shows a tab
	 */
	show : function() {
		this.active = true;
		if (this.src != null) {
			// mod BP 2010
			$("#"+ this.parentId + "iframebox").css({'display':"block"});
			// end mod BP 2010
			document.getElementById(this.parentId + "iframe").src = this.src
				+ "?stateTarget="+this.parentId+"&autorequest=true";
		} else {
			// mod BP 2010
			$("#"+ this.id + "box").css({'display':"block"});
			// end mod BP 2010
		}
		document.getElementById(this.id + "head").className = "tab_button_active";
	}
};
/**
 * DynLinkedList - a linked list class
 */
DynLinkedList = function() {
	this.items = new Array();
	this.first = null;
	this.last = null;
	this.alphabetic = false;
};

DynLinkedList.prototype = {
	/**
	 * adds an item to a list
	 */
	addItem : function(name, value) {
		var item;
		if (this.alphabetic) {
			
		} else {
			if (!value) {
				value = name;
			}
			if (this.items[name] != null) {
				item = this.items[name];
				item.setValue(value);
			} else {
				item = new DynListItem(name, value, this.last, null);
				this.first = item.getPrevious()==null?item:this.first;
				if (this.last!=null) {
					this.last.setNext(item);
				}
				this.last = item;
				this.items[name] = item;
			}
		}
		return item;
	},
	/**
	 * adds an item before another in a list
	 */
	addItemBefore : function(name, value, before) {
		if (before != null) {
			if (!value) {
				value = name;
			}
			var item;
			if (this.items[name] != null) {
				item = this.items[name];
				item.setValue(value);
				if (item.getPrevious() != null) {
					item.getPrevious().setNext(item.getNext());
				} else {
					this.first = item;
				}
				if (item.getNext() != null) {
					item.getNext().setPrevious(item.getPrevious());
				} else {
					this.last = item.getPrevious();
				}
			} else {
				item = new DynListItem(name, value);
				this.items[name] = item;
			}
			if (before.getPrevious() != null) {
				item.setPrevious(before.getPrevious());
				before.getPrevious().setNext(item);
			} else {
				this.first = item;
			}
			item.setNext(before);
			before.setPrevious(item);
			return item;
		}
	},
	/**
	 * adds a item behind another in a list
	 */
	addItemBehind : function(name, value, behind) {
		if (!value) {
			value = name;
		}
		var item;
		if (this.items[name] != null) {
			item = this.items[name];
			item.setValue(value);
			if (item.getPrevious() != null) {
				item.getPrevious().setNext(item.getNext());
			} else {
				this.first = item.setNext();
			}
			if (item.getNext() != null) {
				item.getNext().setPrevious(item.getPrevious());
			} else {
				this.last = item;
			}
		} else {
			item = new DynListItem(name, value);
			this.items[name] = item;
		}
		if (behind.getNext() != null) {
			item.setNext(behind.getNext());
			behind.getNext().setPrevious(item);
		} else {
			this.last = item;
		}
		item.setPrevious(behind);
		behind.setNext(item);
		return item;
	},
	/**
	 * returns the first item of a list
	 */
	getFirst : function() {
		return this.first;
	},
	/**
	 * return an item from a list by its name
	 */
	getItem : function(name) {
		return this.items[name]||null;
	},
	/**
	 * returns the last item of a list
	 */
	getLast : function() {
		return this.last;
	},
	/**
	 * returns the length of a list
	 */
	getLength : function() {
		return this.items.length;
	},
	/**
	 * returns the next item of a list
	 */
	getNext : function(item) {
		if ((typeof item) == "string") {
			return this.getNext(this.items[item]);
		}
		try {
			return item.getNext();
		} catch(ex) {
			return null;
		}
	},
	/**
	 * returns the previous item of a list
	 */
	getPrevious : function(item) {
		if ((typeof item) == "string") {
			return this.getPrevious(this.items[item]);
		}
		try {
			return item.getPrevious();
		} catch(ex) {
			return null;
		}
	},
	/**
	 * returns the value of item
	 */
	getValue : function(name) {		
		try {
			return this.items[name].getValue();
		} catch(ex) {
			return null;
		}
	},
	/**
	 * removes all items from a list
	 */
	removeAllItems : function() {
		this.first = null;
		this.last = null;
		this.items = new Array();
	},
	
	/**
	 * Removes an item from a list.
	 */
	removeItem : function(item) {
		if (item!=null) {
			if ((typeof item) == "string") {
				this.removeItem(this.items[item]);
			} else {
				if (item.getPrevious() != null) {
					item.getPrevious().setNext(item.getNext());
				} else {
					this.first = item.getNext();
				}
				if (item.getNext() != null) {
					item.getNext().setPrevious(item.getPrevious());
				} else {
					this.last = item.getPrevious();
				}
				if (this.items[item.getName()] != null) {
					this.items[item.getName()] = null;
				} else 
				if (this.items[item.getName()+item.getValue()] != null) {
					this.items[item.getName()+item.getValue()] = null;
				} 
			}
		}
	},
	
	/**
	 * returns the string value of a list
	 */
	toString : function() {
		var elem = this.first;
		var output = "";
		while (elem != null) {
			output += elem.getName() + " - " + elem.getValue()+"\n";
			elem = elem.getNext();
		}
		return output;
	},
	/**
	 * unloads the list
	 */
	unload : function() {
		var element;
		if (this.items){
			for( element in this.items)
				delete element;
			delete this.items;
		}
		if (this.first)
			delete this.first;
		if (this.last)
			delete this.last;
	}
};

/**
 * DynListItem - a list item class
 */
DynListItem = function(name, value, prev, next) {
	this.name = name||"";
	this.value = value;
//	this.value = value||null;
	this.prev = prev||null;
	this.next = next||null;
	if (name.substr(0,(name.length/2)) == name.substr((name.length/2),name.length)) {
		this.name = name.substr(0,(name.length/2));
	} else if (this.name.endsWith(this.value)) {
		this.name = this.name.substr(0,this.name.length-this.value.length);
	}
};

DynListItem.prototype = {
	/**
	 * returns the name of a item
	 */
	getName : function() {
		return this.name;
	},
	/**
	 * returns the next item
	 */
	getNext : function() {
		return this.next;
	},
	/**
	 * returns the previous item
	 */
	getPrevious : function() {
		return this.prev;
	},
	/**
	 * returns the value of a item
	 */
	getValue : function() {
		return this.value;
	},
	/**
	 * sets the name of a item
	 */
	setName : function(name) {
		this.name = name;
	},
	/**
	 * sets the next item of a item
	 */
	setNext : function(next) {
		this.next = next;
	},
	/**
	 * sets the previous item of a item
	 */
	setPrevious : function(previous) {
		this.prev = previous;
	},
	/**
	 * sets the value of item
	 */
	setValue : function(value) {
		this.value = value;
	}
};
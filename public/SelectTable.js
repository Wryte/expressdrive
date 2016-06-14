function SelectTable(params) {
	var self = this

	this.hashId = "#" + params.id
	this.passedUpdateSelection = params.updateSelection
	this.table = document.getElementById(params.id)
	this.selectAllIcon = this.table.querySelector(".select-all-td i")

	bindOn("click", this.hashId + " .select-td", function(e) {
		var parentTR = this.parentElement
		var icon = this.querySelector(".fa")

		if (hasClass(parentTR, "selected")) {
			removeClass(parentTR, "selected")
			self.selectOffTL(icon)
		} else {
			addClass(parentTR, "selected")
			self.selectOnTL(icon)
		}

		updateSelection()
	})

	bindOn("click", this.hashId + " .select-all-td", function(e) {
		var selected = self.getSelected()
		var itemElements = self.table.querySelectorAll(".item-element")
		var tl = new TimelineMax()
		
		if (selected.length == 0) {
			addClass(self.selectAllIcon, "selected")
			tl.add(self.selectOnTL(self.selectAllIcon))

			for (var i = 0; i < itemElements.length; i++) {
				var itemElement = itemElements[i]
				addClass(itemElement, "selected")
				tl.add(self.selectOnTL(itemElement.querySelector(".select-td i")), i == 0 ? "a" : "a+=" + (0.05 * i))
			}

		} else {
			if (itemElements.length == selected.length) {
				removeClass(self.selectAllIcon, "selected")
				tl.add(self.selectOffTL(self.selectAllIcon))
			}

			for (var i = 0; i < selected.length; i++) {
				var itemElement = selected[i]
				removeClass(itemElement, "selected")
				tl.add(self.selectOffTL(itemElement.querySelector(".select-td i")), i == 0 ? "a" : "a+=" + (0.05 * i))
			}
		}

		tl.add(TweenMax.delayedCall(0, updateSelection))
	})

	function updateSelection() {
		var selected = self.getSelected()
		var itemElements = self.table.querySelectorAll(".item-element")

		self.passedUpdateSelection(selected)

		if (selected.length == itemElements.length) {
			if (!hasClass(self.selectAllIcon, "selected")) {
				addClass(self.selectAllIcon, "selected")
				self.selectOnTL(self.selectAllIcon)
			}
		} else if (hasClass(self.selectAllIcon, "selected")) {
			removeClass(self.selectAllIcon, "selected")
			self.selectOffTL(self.selectAllIcon)
		}
	}
}

SelectTable.prototype.selectOnTL = function(icon) {
	var tl = new TimelineMax()
	
	tl.to(icon, 0.1, { scale: 0.6, color: "#75B37A" })
	tl.add(TweenMax.delayedCall(0, function() {
		removeClass(icon, "fa-circle-o")
		addClass(icon, "fa-check-circle-o")
	}))
	tl.to(icon, 0.1, { scale: 1 })

	return tl
}

SelectTable.prototype.selectOffTL = function(icon) {
	var tl = new TimelineMax()
	
	tl.to(icon, 0.1, { scale: 0.6, color: "#333" })
	tl.add(TweenMax.delayedCall(0, function() {
		removeClass(icon, "fa-check-circle-o")
		addClass(icon, "fa-circle-o")
	}))
	tl.to(icon, 0.1, { scale: 1 })

	return tl
}

SelectTable.prototype.getSelected = function() {	
	return this.table.querySelectorAll(".item-element.selected")
}
document.addEventListener("DOMContentLoaded", function() {
	var createUserPopupButton = document.getElementById("createUserPopupButton")
	var editUserPopupButton = document.getElementById("editUserPopupButton")
	var deleteUserPopupButton = document.getElementById("deleteUserPopupButton")

	// file selection
	function updateSelection(selected) {
		if (selected.length == 0) {
			addClass(editUserPopupButton, "disabled")
			addClass(deleteUserPopupButton, "disabled")
		}
		if (selected.length >= 1) {
			removeClass(deleteUserPopupButton, "disabled")
			removeClass(editUserPopupButton, "disabled")
		}
		if (selected.length > 1) {
			addClass(editUserPopupButton, "disabled")
		}
	}

	var selectTable = new SelectTable({
		id: "adminTable",
		updateSelection: updateSelection
	})
})
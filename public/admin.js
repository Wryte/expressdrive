document.addEventListener("DOMContentLoaded", function() {
	function reloadUserTable() {
		var userTableContainer = document.getElementById("userTableContainer")
		var xhr = new XMLHttpRequest()
		xhr.open("GET", __path + "/userTable")

		xhr.onload = function(data) {
			if (xhr.status == 200) {
				userTableContainer.innerHTML = xhr.responseText
			}
		}

		xhr.send()
	}

	var shade = document.getElementById("shade")

	var createUserPopupButton = document.getElementById("createUserPopupButton")
	var createUserPopup = document.getElementById("createUserPopup")
	var usernameInput = document.getElementById("usernameInput")
	var passwordInput = document.getElementById("passwordInput")
	var passwordRepeatInput = document.getElementById("passwordRepeatInput")
	var permissionSelect = document.getElementById("permissionSelect")
	var createUserButton = document.getElementById("createUserButton")

	var editUserPopupButton = document.getElementById("editUserPopupButton")

	var deleteUserPopupButton = document.getElementById("deleteUserPopupButton")

	var closeShade

	// bind toolbar buttons
	createUserPopupButton.onclick = function() {
		closeShade = generatePopupTL(createUserPopup, shade)
	}

	// createUser events
	usernameInput.onkeyup = sanitizeKeyUp

	createUserButton.onclick = function() {
		var username = usernameInput.value
		var password = passwordInput.value
		var passwordRepeat = passwordRepeatInput.value
		var permission = permissionSelect.value
		var clean = true

		removeClass([usernameInput, passwordInput, passwordRepeatInput], "bad-input")

		if (username == "") {
			addClass(usernameInput, "bad-input")
			clean = false
		}
		if (password == "") {
			addClass(passwordInput, "bad-input")
			clean = false
		}
		if (passwordRepeat == "") {
			addClass(passwordRepeatInput, "bad-input")
			clean = false
		}
		if (passwordRepeat !== password) {
			addClass(passwordRepeatInput, "bad-input")
			clean = false
		}

		if (clean) {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/createUser")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					reloadUserTable()
				}
			}

			xhr.send(JSON.stringify({
				username: username,
				password: Sha256.hash(username + password),
				permission: permission
			}))
		}
	}

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
		id: "usersTable",
		updateSelection: updateSelection
	})
})
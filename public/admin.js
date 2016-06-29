document.addEventListener("DOMContentLoaded", function() {
	function reloadUserTable(callback) {
		var userTableContainer = document.getElementById("usersTableContainer")
		var xhr = new XMLHttpRequest()
		xhr.open("GET", __path + "/userTable")

		xhr.onload = function(data) {
			if (xhr.status == 200) {
				userTableContainer.innerHTML = xhr.responseText
				if (callback) { callback() }
			}
		}

		xhr.send()
	}

	var shade = document.getElementById("shade")

	var createUserPopupButton = document.getElementById("createUserPopupButton")
	var createUserPopup = document.getElementById("createUserPopup")
	var usernameInputCU = document.getElementById("usernameInputCU")
	var passwordInputCU = document.getElementById("passwordInputCU")
	var passwordRepeatInputCU = document.getElementById("passwordRepeatInputCU")
	var permissionSelectCU = document.getElementById("permissionSelectCU")
	var createUserButton = document.getElementById("createUserButton")

	var editUserPopupButton = document.getElementById("editUserPopupButton")
	var editUserPopup = document.getElementById("editUserPopup")
	var editUserHeaderSpan = document.getElementById("editUserHeaderSpan")
	var usernameInputEU = document.getElementById("usernameInputEU")
	var passwordInputEU = document.getElementById("passwordInputEU")
	var passwordRepeatInputEU = document.getElementById("passwordRepeatInputEU")
	var permissionSelectEU = document.getElementById("permissionSelectEU")
	var editUserButton = document.getElementById("editUserButton")

	var deleteUsersPopupButton = document.getElementById("deleteUsersPopupButton")
	var deleteUsersPopup = document.getElementById("deleteUsersPopup")
	var deleteUsersButton = document.getElementById("deleteUsersButton")
	var deleteUsersHeaderSpan = document.getElementById("deleteUsersHeaderSpan")
	var deleteUsersBodySpan = document.getElementById("deleteUsersBodySpan")

	var closeShade

	// bind toolbar buttons
	createUserPopupButton.onclick = function() {
		closeShade = generatePopupTL(createUserPopup, shade)
	}

	editUserPopupButton.onclick = function() {
		var selected = selectTable.getSelected()
		if (selected.length == 1) {
			editUserHeaderSpan.innerText = selected[0].dataset.username
			usernameInputEU.value = selected[0].dataset.username
			permissionSelectEU.value = selected[0].dataset.permission
			closeShade = generatePopupTL(editUserPopup, shade)
		}
	}

	deleteUsersPopupButton.onclick = function() {
		var selected = selectTable.getSelected()
		if (selected.length > 0) {
			deleteUsersHeaderSpan.innerText = selected.length == 1 ? "'" + selected[0].dataset.username + "'" : selected.length + " users"
			deleteUsersBodySpan.innerText = selected.length == 1 ? "this user" : "these users"
			closeShade = generatePopupTL(deleteUsersPopup, shade)
		}
	}

	// createUser events
	usernameInputCU.onkeyup = sanitizeKeyUp()

	createUserButton.onclick = function() {
		var username = usernameInputCU.value
		var password = passwordInputCU.value
		var passwordRepeat = passwordRepeatInputCU.value
		var permission = permissionSelectCU.value
		var clean = true

		removeClass([usernameInputCU, passwordInputCU, passwordRepeatInputCU], "bad-input")

		if (username == "") {
			addClass(usernameInputCU, "bad-input")
			clean = false
		}
		if (password == "") {
			addClass(passwordInputCU, "bad-input")
			clean = false
		}
		if (passwordRepeat == "") {
			addClass(passwordRepeatInputCU, "bad-input")
			clean = false
		}
		if (passwordRepeat !== password) {
			addClass(passwordRepeatInputCU, "bad-input")
			clean = false
		}

		if (clean) {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/createUser")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					usernameInputCU.value = ""
					passwordInputCU.value = ""
					passwordRepeatInputCU.value = ""
					permissionSelectCU.value = 1
					reloadUserTable(updateSelection)
				}
			}

			xhr.send(JSON.stringify({
				username: username,
				password: Sha256.hash(username + password),
				permission: permission
			}))
		}
	}

	// createUser events
	usernameInputEU.onkeyup = sanitizeKeyUp()

	editUserButton.onclick = function() {
		var selected = selectTable.getSelected()
		var id = selected[0].dataset.id
		var oldUsername = selected[0].dataset.username
		var oldPermission = selected[0].dataset.permission
		var username = usernameInputEU.value
		var password = passwordInputEU.value
		var passwordRepeat = passwordRepeatInputEU.value
		var permission = permissionSelectEU.value
		var clean = true

		removeClass([usernameInputEU, passwordInputEU, passwordRepeatInputEU], "bad-input")

		if (username == "") {
			addClass(usernameInputEU, "bad-input")
			clean = false
		}
		if (passwordRepeat !== password) {
			addClass(passwordRepeatInputEU, "bad-input")
			clean = false
		}

		if (username == oldUsername && passwordRepeat == "" && password == "" && permission == oldPermission) {
			if (closeShade) { closeShade() }
		} else if (clean) {
			var xhr = new XMLHttpRequest()

			xhr.open("POST", __path + "/editUser")
			xhr.setRequestHeader("Content-type", "application/json");

			xhr.onload = function(e) {
				if (xhr.status == 200) {
					if (closeShade) { closeShade() }
					usernameInputEU.value = ""
					passwordInputEU.value = ""
					passwordRepeatInputEU.value = ""
					permissionSelectEU.value = "read-only"
					reloadUserTable(updateSelection)
				}
			}

			var data = {
				id: id,
				username: username,
				permission: permission
			}

			if (password !== "") {
				data.password = Sha256.hash(username + password)
			}

			xhr.send(JSON.stringify(data))
		}
	}

	// deleteUsers events

	deleteUsersButton.onclick = function() {
		var selected = selectTable.getSelected()
		var ids = []

		for (var i = 0; i < selected.length; i++) {
			ids.push(selected[i].dataset.id)
		}

		var xhr = new XMLHttpRequest()
		
		xhr.open("POST", __path + "/deleteUsers")
		xhr.setRequestHeader("Content-type", "application/json");

		xhr.onload = function(e) {
			if (xhr.status == 200) {
				if (closeShade) { closeShade() }
				reloadUserTable(updateSelection)
			}
		}

		xhr.send(JSON.stringify({ ids: ids }))
	}

	// file selection
	function updateSelection() {
		var selected = selectTable.getSelected()
		if (selected.length == 0) {
			addClass(editUserPopupButton, "disabled")
			addClass(deleteUsersPopupButton, "disabled")
		}
		if (selected.length >= 1) {
			removeClass(deleteUsersPopupButton, "disabled")
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
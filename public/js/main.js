let user = ''; // The username of the person currently logged in. (Can't have blank username.)

function isValidHex(hex) {
	/*
	Check if the given hex is a valid hexidecimal color code.
	(Returns boolean.)
	*/
	return hex.match(/^#[0-9a-f]{6}$/gi) !== null;
}

function updateColorPreview(input_id, preview_id) {
	/*
	Update the color of the given preview box.
	(Returns nothing.)
	*/
	// Get elements from the given ids.
	let input = document.querySelector(input_id);
	let box = document.querySelector(preview_id);

	// Hex is valid.
	if(isValidHex(input.value)) {
		// Update the color preview.
		box.style.backgroundColor = input.value;
	}
	// Hex is invalid.
	else {
		// Set the color to white.
		box.style.backgroundColor = '#ffffff';
	}
}

function resetInput() {
	/*
	Resets all user input values.
	(Returns nothing.)
	*/
	// Define variable to store a list of color inputs.
	let inputs = [document.querySelector('#color1'), document.querySelector('#color2'),
	document.querySelector('#color3')]; 

	// Reset the values of each input.
	for(let input of inputs) {
		input.value = ''
	}

	// Reset the colors of each color preview box.
	for(let box of document.querySelectorAll('.color-preview')) {
		box.style.backgroundColor = 'white';
	}
}

async function register() {
	/*
	Registers a new user.
	(Returns nothing.)
	*/
	// Define request body.
	let data = {
		'username': document.querySelector('#username').value,
		'password': document.querySelector('#password').value,
	}

	// Send request to server.
	let response = await fetch('/register', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify(data)
	});

	// Define variable to store response json.
	let json = await response.json();

	// Alert the user of the status of their registration.
	alert(json['body']['message']);

	// Registration successful.
	if(json['body']['registered']) {
		// Clear the username and password.
		clearCredentials();
	}
}

async function logIn() {
	/*
	Tries to log the user in with the specified user and password
	(Returns nothing.)
	*/

	// Define request body.
	let username = document.querySelector('#username').value;  // We reuse this later.
	let data = {
		'username': username,
		'password': document.querySelector('#password').value,
	}

	// Send request to server.
	let response = await fetch('/login', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify(data)
	});

	// Define variable to store response json.
	let json = await response.json();

	// Alert the user of the status of their log in.
	alert(json['body']['message']);

	// Log in successful.
	if(json['body']['logged_in']) {
		// Clear the username and password.
		clearCredentials();

		// Store the current username.
		user = username;

		// Display the user's name above the table.
		document.querySelector('#table-user').innerHTML = user;

		// Show/hide the appropriate elements.
		document.querySelector('#app-wrapper').style.display = 'flex';
		document.querySelector('#log-in-wrapper').style.display = 'none';

		// Redraw the table with all of the user's data.
		refresh();
	}
}

function logOut() {
	/*
	Log out the current user.
	*/
	// Remove the current username.
	user = '';

	// Show/hide the appropriate elements.
	document.querySelector('#app-wrapper').style.display = 'none';
	document.querySelector('#log-in-wrapper').style.display = 'block';

	// Empty the table.
	redraw([]);
}

function clearCredentials() {
	/*
	Clears the username and password input values.
	(Returns nothing.)
	*/
	document.querySelector('#username').value = '';
	document.querySelector('#password').value = '';
}

function redraw(data) {
	/*
	Fill the user data table with the given data.
	(Returns nothing.)
	*/
	// Define variables.
	let table = document.querySelector('#data-table');
	let table_data = [`<tr>
        <th>Color 1</th>
        <th>Color 2</th>
        <th>Color 3</th>
        <th>Mixed</th>
      </tr>`]; // Inner HTML for the user table with new data inserted.

	// Add each row/entry to 'table_data'.
	for(let entry of data) {
		// Define variables to store each color in the entry.
		let color_1 = entry['color1'];
		let color_2 = entry['color2'];
		let color_3 = entry['color3'];
		let mixed = entry['mixed'];

		// Add the entry to the table data.
		table_data.push(`
			<tr>
			  <td>
				<div class='input-wrapper center-flex'>
					<p>${color_1}</p>
					<div class='mini-color-preview' style='background: ${color_1}'></div>
				</div>
			  </td>
			  <td>
				<div class='input-wrapper center-flex'>
					<p>${color_2}</p>
					<div class='mini-color-preview' style='background: ${color_2}'></div>
				</div>
			  </td>
			  <td>
				<div class='input-wrapper center-flex'>
					<p>${color_3}</p>
					<div class='mini-color-preview' style='background: ${color_3}'></div>
				</div>
			  </td>
			  <td>
				<div class='input-wrapper center-flex'>
					<p>${mixed}</p>
					<div class='mini-color-preview' style='background: ${mixed}'></div>
				</div>
			  </td>
			</tr>`);
	}

	// Update the user data table.
	table.innerHTML = table_data.join('\n');
}

async function submit() {
	/*
	Submit a new row of data to the database.
	(Returns nothing.)
	*/
	// Define variables.
	let inputs = [document.querySelector('#color1'), document.querySelector('#color2'), // List of color inputs.
		document.querySelector('#color3')]; 
	let data = { // Body of request.
		'username': user
	};

	// Check all input values.
	for(let input of inputs) {
		// Declare variable to store input value.
		// If the input value is not legal hex, set it to white (#ffffff).
		let value = isValidHex(input.value) ? input.value : '#ffffff';

		// Insert the new colors into data.
		data[input.id] = value;
	}

	// Send request to server.
	let response = await fetch('/submit', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify(data)
	});

	// Redraw the user table with the response data.
	let json = await response.json();
	redraw(json);

	// Reset inputs.
	resetInput();
}

async function retrieve() {
	/*
	Retrieve all of the user's data from the database.
	(Returns object.)
	*/
	// Send request to server.
	let response = await fetch('/retrieve', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify({ 'username': user })
	});
	
	// Return the parsed response.
	return await response.json();
}

async function refresh() {
	/*
	Refresh the user data table.
	*/
	redraw(await retrieve());
}

async function clearDatabase() {
	/*
	Clear all data in the database.
	(Returns nothing.)
	*/
	// Send request to server.
	// ! NOTE: Choosing to not await here fore more responsive feel. This could cause issues if the
	// !       user acts too quickly after clicking clear.
	fetch('/clear', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify({ 'username': user })
	});

	// Clear the user data table.
	redraw([]);
}

// todo
async function lighten() {
	/*
	Lighten all colors in the database.
	(Returns nothing.)
	*/
	// Send request to server.
	let response = await fetch('/lighten', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify({ 'username': user })
	});

	// Redraw the lightened user data table.
	redraw(await response.json());
}

// todo
async function darken() {
	/*
	Darken all colors in the database.
	(Returns nothing.)
	*/
	// Send request to server.
	let response = await fetch('/darken', {
		'method': 'POST',
		'headers': {
			'content-type': 'application/json'
		},
		'body': JSON.stringify({ 'username': user })
	});

	// Redraw the darkened user data table.
	redraw(await response.json());
}
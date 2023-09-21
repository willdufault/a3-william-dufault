// Set up Express app and port.
let express = require('express');
let app = express();
let port = process.env.PORT || 3000;

// Serve static files.
// (Second line makes handling requests easier.)
app.use(express.static('public'));
app.use(express.json());

// Listen on desired port.
app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});

// Store connection string from MongoDB Atlas.
let mongoose = require('mongoose');
let mongodb_connection_string = 'mongodb+srv://dbuser:dbpassword@cluster0.bmbzpgn.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp'

// Followed tutorial on https://sparkbyexamples.com/mongodb/node-js-using-express-with-mongodb/.
// Create database class.
class Database {
	constructor() {
		/*
		Connect to the MongoDB database on database instantiation.
		*/
		mongoose
			.connect(mongodb_connection_string)
			.then(() => {
				console.log('connection successful');
			})
			.catch((error) => {
				console.log('connection failed');
			});
	}
}

// Instantiate database.
module.exports = new Database();

// Define mongoose models and schemas.
let UserData = mongoose.model('UserData', {
	'username': String,
	'password': String
});
let ColorData = mongoose.model('ColorData', {
	'username': String,
	'color1': String,
	'color2': String,
	'color3': String,
	'mixed': String
});

// POST and GET endpoints.
app.post('/register', async (request, response) => {
	/*
	Add a new user to the database.
	*/
	// Define variable to store request body.
	let data = request.body;

	// Empty username.
	if(data['username'] === '') {
		response.send({
			'body': {
				'registered': false,
				'message': 'cannot have a blank username'
			}
		});
		return;
	}

	// Try adding data to database.
	try {
		// Define variables.
		let registered = false; // Registration status.
		let message = 'failed to register. a user with that name already exists.'; // Register message.

		// New user.
		if((await UserData.find({ 'username': data['username'] })).length === 0) {
			// Register the new user.
			UserData(data).save();
			registered = true;
			message = 'registration successful.';
		}

		// Send the registration status back to the client.
		response.send({
			'body': {
				'registered': registered,
				'message': message
			}
		});
	}
	// Error adding data to database.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/login', async (request, response) => {
	/*
	Add a new user to the database.
	*/
	// Try querying the database.
	try {
		// Define variable to store request body.
		let data = request.body;

		// Empty username.
		if(data['username'] === '') {
			response.send({
				'body': {
					'logged_in': false,
					'message': 'cannot have a blank username.'
				}
			});
			return;
		}
		
		// Define variables.
		let logged_in = false; // Log in status.
		let message = 'log in failed. please check your credentials and try again.'; // Register message.

		// Log in is valid.
		// True if there is exactly one user that matches the given username and password.
		if((await UserData.find(data)).length === 1) {
			logged_in = true;
			message = 'successfully logged in.';
		}

		// Send the log in status back to the client.
		response.send({
			'body':  {
				'logged_in': logged_in,
				'message': message
			}
		});
	}
	// Error querying the database.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/submit', async (request, response) => {
	/*
	Add new data to the database.
	*/
	// Define variable to store the request body.
	let data = request.body;

	// Add the derived field (mix the colors).
	data['mixed'] = averageHex([data['color1'], data['color2'], data['color3']]);

	// Try adding data to database.
	try {
		ColorData(data).save();

		// Fetch all of the user's entries in database and send back to client.
		response.send(await ColorData.find({ 'username': data['username']}));
	}
	// Error adding data to database.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/retrieve', async (request, response) => {
	/*
	Send the client all of the user's data.
	*/
	// Try fetching data from the  database.
	try {
		// Fetch all of the user's entries in database and send back to client.
		response.send(await ColorData.find(request.body));
	}
	// Error fetching data.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/clear', async (request, response) => {
	/*
	Clear the database.
	*/
	// Try clearing the database.
	try {
		await ColorData.deleteMany(request.body);
		response.send({ 'body': 'database cleared' });
	}
	// Error adding data to database.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/lighten', async (request, response) => {
	/*
	Lighten all of the user's colors.
	*/
	// Define variable to store the request body.
	let data = request.body;

	// Try updating documents the database.
	try {
		// Get all user color data from the database.
		let color_data = await ColorData.find({'username': data['username']});

		// Lighten all the colors in the user data.
		for(let entry of color_data) {
			entry['color1'] = addHex(entry['color1'], '#111111');
			entry['color2'] = addHex(entry['color2'], '#111111');
			entry['color3'] = addHex(entry['color3'], '#111111');
			// Need to recalculate the mixed value because when a color reaches white (#ffffff), it 
			// no longer increases by #111111, so the mixed will not increase by that much either.
			entry['mixed'] = averageHex([entry['color1'], entry['color2'], entry['color3']]);
			await entry.save();
		}

		// Fetch all of the user's entries in database and send back to client.
		response.send(color_data);
	}
	// Error updating documents.
	catch (error) {
		response.status(400).send(error);
	}
});

app.post('/darken', async (request, response) => {
	/*
	Darken all of the user's colors.
	*/
	// Define variable to store the request body.
	let data = request.body;

	// Try updating documents the database.
	try {
		// Get all user color data from the database.
		let color_data = await ColorData.find({'username': data['username']});

		// Darken all the colors in the user data.
		for(let entry of color_data) {
			entry['color1'] = subtractHex(entry['color1'], '#111111');
			entry['color2'] = subtractHex(entry['color2'], '#111111');
			entry['color3'] = subtractHex(entry['color3'], '#111111');
			// Need to recalculate the mixed value because when a color reaches white (#ffffff), it 
			// no longer increases by #111111, so the mixed will not increase by that much either.
			entry['mixed'] = averageHex([entry['color1'], entry['color2'], entry['color3']]);
			await entry.save();
		}

		// Fetch all of the user's entries in database and send back to client.
		response.send(color_data);
	}
	// Error updating documents.
	catch (error) {
		response.status(400).send(error);
	}
});

function parseHex(hex) {
	/*
	Converts a hexadecimal string (no leading '#') to an integer.
	(returns integer).
	*/
	return parseInt(`0x${hex}`, 16);
}

function addHex(hex_1, hex_2) {
	/*
	Adds two hex strings (representing RGB) together.
	(Returns string).
	*/
	// Define variable to store the result.
	let result = '#';

	// Check each color in the two hex values.
	for(let i = 1; i < 7; i += 2) {
		// Define variables to store the hex values of the current color (r, g, b).
		let color_1 = hex_1.slice(i, i + 2);
		let color_2 = hex_2.slice(i, i + 2);

		// Define a variable to store the minimum hex value between the max 2-digit hex number 
		// (0xff) and the sum of the two colors.
		let min_hex = Math.min(0xff, parseHex(color_1) + parseHex(color_2));


		// Add the min to the result string.
		result += (min_hex < 16 ? '0' : '') + min_hex.toString(16);
	}

	// Return the new summed hex string.
	return result;
}

function subtractHex(hex_1, hex_2) {
	/*
	Subtracts one hex value (representing RGB) from another.
	(Returns string).
	*/
	// Define variable to store the result.
	let result = '#';

	// Check each color in the two hex values.
	for(let i = 1; i < 7; i += 2) {
		// Define variables to store the hex values of the current color (r, g, b).
		let color_1 = hex_1.slice(i, i + 2);
		let color_2 = hex_2.slice(i, i + 2);
		// Define a variable to store the minimum hex value between the min 2-digit hex number 
		// (0x0) and the difference between the two colors.
		let max_hex = Math.max(0, parseHex(color_1) - parseHex(color_2));

		// Add the min to the result string.
		result += (max_hex < 16 ? '0' : '') + max_hex.toString(16);
	}

	// Return the new summed hex string.
	return result;
}

function averageHex(hexes) {
	/*
	Finds the average hex value of the list of hex values (representing RGB).
	*/
	// Define variables to store the sums of each color (r, g, b).
	let sum_r = 0;
	let sum_g = 0;
	let sum_b = 0;

	// Sum up the rgb values of each hex.
	for(let hex of hexes) {
		sum_r += parseHex(hex.slice(1, 3));
		sum_g += parseHex(hex.slice(3, 5));
		sum_b += parseHex(hex.slice(5));
	}

	// Get the average values for each color.
	let length = hexes.length;
	sum_r = Math.floor(sum_r / length);
	sum_g = Math.floor(sum_g / length);
	sum_b = Math.floor(sum_b / length);
	
	// Convert the rgb values to strings.
	let r = (sum_r < 16 ? '0' : '') + sum_r.toString(16);
	let g = (sum_g < 16 ? '0' : '') + sum_g.toString(16);
	let b = (sum_b < 16 ? '0' : '') + sum_b.toString(16);

	// Return the constructed average hex string.
	return `#${r}${g}${b}`;
}
var fs 				= require('fs');
const express 		= require('express');
const bodyParser 	= require('body-parser');
const port 			= process.env.PORT || 8080;

var details 		= {};
const app 			= express()

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', function (req, res) {
	details = getDetails(req.body.sessionId);

	if (req.body.isActive === '0') {
		callEnded(req, res);
		return;
	}

	let digits = req.body.dtmfDigits;
	console.log("DTMF: " + digits);
	console.log("details: " + JSON.stringify(details));

	if (details.language_selected != true) {
		switch (digits) {
			case '1':
				english(req, res);
				break;
			
			case '2':
				pidgin(req, res);
				break;
			
			default:
				return base(req, res);
				break;
		}

		return
	}

	switch (digits) {
		case '1':
			support(req, res);
			break;
		
		case '2':
			sales(req, res);
			break;
		
		default:
			unknownOption(req, res);
			break;
	}

	return;
});

app.listen(port, () => console.log(`Call Center listening on port ${port}!`));


function base(req, res)
{
	let text = "Welcome. Select your language. Press 1 for english, 2 for pidgin.";

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
		  <GetDigits  timeout="10">
		    <Say voice="man" playBeep="true">`+text+`</Say>
		  </GetDigits>
		</Response>`;

	res.send(response);
}

function english(req, res)
{
	details.language_selected = true;
	details.language = "english";
	updateDetails(req.body.sessionId, details);

	let text = "You selected english, press 1 to speak to support, press 2 to speak to sales.";

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
		  <GetDigits  timeout="10">
		    <Say voice="man" playBeep="true">` + text + `</Say>
		  </GetDigits>
		</Response>`;

	res.send(response);
}

function pidgin(req, res)
{
	details.language_selected = true;
	details.language = "pidgin";
	updateDetails(req.body.sessionId, details);

	let text = "You don select pdigin, press 1 to follow support talk, press 2 for sales.";

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
		  <GetDigits  timeout="10">
		    <Say voice="man" playBeep="true">` + text + `</Say>
		  </GetDigits>
		</Response>`;

	res.send(response);
}

function support(req, res)
{
	let language = details.language;

	let text = "Your call is being forwarded to a support agent. Note that this call may be recorded.";
	let phoneNumbers = process.env.SUPPORT_PHONES_ENG;

	if (language == "pidgin") {
		text = "We dey connect you to one of our support people. Know say we dey record this call.";
		phoneNumbers = process.env.SUPPORT_PHONES_PNG;
	}

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
		  <Say voice="man" playBeep="true">`+ text +`</Say>
		  <Dial phoneNumbers="` + phoneNumbers + `" record="true" sequential="false"/>
		</Response>`;

	res.send(response);
}

function sales(req, res)
{
	let language = details.language;

	let text = "Your call is being forwarded to a sales agent. Note that this call may be recorded.";
	let phoneNumbers = process.env.SALES_PHONES_ENG;

	if (language == "pidgin") {
		text = "We dey connect you to one of our sales people. Know say we dey record this call.";
		phoneNumbers = process.env.SALES_PHONES_PNG;
	}

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		<Response>
		  <Say voice="man" playBeep="true">`+ text +`</Say>
		  <Dial phoneNumbers="` + phoneNumbers + `" record="true" sequential="false"/>
		</Response>`;

	res.send(response);
}

function unknownOption(req, res)
{
	let text = "You have selected an unknown option";
	if (details.language == "pidgin") {
		$text = "We no understand the option wey you select.";
	}

	let response = `<?xml version="1.0" encoding="UTF-8"?>
		    <Say voice="man" playBeep="true">` + text + `</Say>
		</Response>`;

	res.send(response);
}

function callEnded(req, res) {
	updateDetails(req.body.sessionId, req.body);
	res.send("call logged");
	return;
}

function getDetails(session) { 
	let path = './data/' + session + '.json';

	if (!fs.existsSync(path)) {
    	fs.writeFileSync(path, "{}");
	}

	let contents = fs.readFileSync(path, 'utf8');
	return JSON.parse(contents);
}

function updateDetails(session, new_details) {
	let path = './data/' + session + '.json';
	let deets = Object.assign(details, new_details);
	fs.writeFileSync(path, JSON.stringify(deets, null, 2));

	return;
}

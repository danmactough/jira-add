#!/usr/bin/env node
/* eslint-env node, es6 */
"use strict";
const path = require("path");
const https = require("https");
// depending on jira-cli from npm to create this config file ¯\_(ツ)_/¯
const config = require(path.join(process.env.HOME, ".jiraclirc.json"));

const uri = `https://${config.host}/rest/api/2/`
const args = getArgs();
if (!(args.project && args.summary)) {
	console.error("  Error: Project and Summary are required");
	process.exit(1);
}
const postData = JSON.stringify({
	"fields": {
		"project":{
			"key": args.project
		},
		"summary": args.summary,
		"issuetype": {
			"name": args.issuetype
		}
	}
});
const options = {
	hostname: config.host,
	port: 443,
	path: "/rest/api/2/issue",
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(postData)
	},
	auth: `${config.user}:${config.password}`
};

const req = https.request(options, (res) => {
  let data = "";
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
  	data += chunk;
  });
  res.on('end', () => {
  	if (res.statusCode < 300) {
	  	const json = JSON.parse(data);
	  	const browseUrl = `https://${config.host}/browse/${json.key}`;
	  	console.log(`Created: ${browseUrl}`);
  	}
  	else {
  		console.error(`Something went wrong: ${res.statusCode}`);
  	}
  });
});

req.on('error', (e) => {
  console.log(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();

function getArgs () {
	return process.argv.reduce((map, arg, index) => {
		let key;

		if (arg === "-p") {
			key = "project";
		}
		else if (arg === "-s") {
			key = "summary"
		}
		else if (arg === "-t") {
			key = "issuetype";
		}

		if (key) {
			map[key] = process.argv[index + 1];
		}

		return map;
	}, { issuetype: "Task", project: config.project });
}

#!/usr/bin/env node
'use strict';
const commander = require('commander'),
	fs = require('fs'),
	svgsprite = require('../index');

commander
	.version('0.0.1')
	.usage('<file> [options]')
	.option('-v, --verbose', 'Output a little more information about what is happening')
	.option('-o, --output [value]', 'Output file (defaults to STDOUT)')
	.parse(process.argv);

if (commander.args.length > 0) {
	svgsprite(commander.args, {verbose: commander.verbose}, (err, sprite) => {
		if (err) {
			console.error('Failed to convert to a sprite.');
			console.log(err);
			process.exit(1);
		}
		if (commander.output) {
			fs.writeFile(commander.output, sprite, (err) => {
				if (err) {
					console.error('Failed to write file: ' + commander.output);
					process.exit(1);
				}
			});
		}
		else {
			console.log(sprite);
		}
	});
}

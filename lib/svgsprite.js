'use strict';

const _async = require('async'),
	chalk = require('chalk'),
	cheerio = require('cheerio'),
	debug = require('./debug'),
	fs = require('fs'),
	path = require('path');

/**
 * Converts an array of SVG files into a single SVG sprite.
 * @param {array} files an array of svg files that should be added to the sprite
 * @param {object} [options] configuration options for when the sprite is being built
 * @param {function} done(err, svg) the function to be called when processing the sprite is completed. If it failed, err
 * will be non-null; otherwise, svg will be set to the contents of the SVG sprite
 */
function svgsprite(files, options, done) {
	if (typeof options === 'function') {
		done = options;
		options = {};
	}

	const log = debug(options.verbose);

	const $ = cheerio.load('<svg xmlns="http://www.w3.org/2000/svg" style="display: none;"></svg>', {xmlMode: true});
	const sprite = $('svg');

	// Create the tasks to be run in parallel
	const tasks = files.map(file => {
		return (cb) => {
			fs.access(file, fs.R_OK, (err) => {
				if (!err) {
					// If the file is readable...
					fs.readFile(file, {encoding: 'utf-8'}, (err, content) => {
						if (err) {
							// There was a problem reading the file
							cb(err);
						}
						else {
							// Convert the content of the file into DOM, and start moving it into a new symbol element
							const svg = cheerio.load(content, {xmlMode: true})('svg');
							// Use the svg's id or base it on the file name
							const id = svg.attr('id') || path.basename(file).replace(/\..*$/, '');
							log(`Spriting ${chalk.bold.cyan(file)} with id ${chalk.bold(id)}.`);
							const $symbol = cheerio.load(`<symbol id="${id}"></symbol>`, {xmlMode: true});
							const symbol = $symbol('symbol');

							symbol.attr('viewBox', getViewBox(svg));

							// Append the symbol into the sprite
							symbol.append(svg.html());
							sprite.append($symbol.xml());
							cb(err, $symbol.xml());
						}
					});
				}
				else {
					// Skipping, since the file could not be read
					log(`Skipping ${chalk.bold.red(file)}.`);
					cb();
				}
			});
		}
	});

	_async.parallel(tasks, (err, results) => {
		done(err, $.xml());
	});
}

/**
 * Get the viewbox dimensions from the original svg element
 * @param {cheerio} svg the svg element
 * @returns {string} a string representing the viewbox dimensions of the svg
 */
function getViewBox(svg) {
	const viewBox = svg.attr('viewBox');
	if (viewBox) {
		return viewBox;
	}
	const height = parseFloat(svg.attr('height'));
	const width = parseFloat(svg.attr('width'));
	if (!isNaN(height) && !isNaN(width)) {
		return `0 0 ${width} ${height}`;
	}
	return '';
}

module.exports = svgsprite;

module.exports = (verbose) => {
	return verbose ? (str) => console.log(str) : () => {};
}

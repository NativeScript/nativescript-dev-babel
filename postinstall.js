require('nativescript-hook').postinstall(__dirname);

var projectDir = process.env['TNS_PROJECT_DIR'];
require('child_process').exec('npm install --save-dev babel-core', { cwd: projectDir }, function (err, stdout, stderr) {
	if (err) {
		console.warn('npm: ' + err.toString());
	}
	process.stdout.write(stdout);
	process.stderr.write(stderr);
});

/**
 * External dependencies
 */
const commandExistsSync = require( 'command-exists' ).sync;
const request = require( 'request' );
const DecompressZip = require( 'decompress-zip' );

/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env, exit, cwd, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { createWriteStream, existsSync } = require( 'fs' );
const { tmpdir } = require( 'os' );

env.WP_DEVELOP_DIR = cwd() + '/wordpress';

if ( existsSync( normalize( cwd() + '/wordpress/wp-config-sample.php' ) ) ) {
	stdout.write( 'It looks like WordPress is already installed, please delete the `wordpress` directory for a fresh install, or run `npm run env start` to start the existing environment.\n' );
	exit( 1 );
}

if ( commandExistsSync( 'git' ) ) {
	execSync( 'git clone --depth=1 git://develop.git.wordpress.org/ wordpress', { stdio: 'inherit' } );
	buildWordPress();
} else {
	stdout.write( "Git isn't available. Switching to downloading a zip version.\n" );
	const tmpZip = normalize( tmpdir() + '/wordpress-develop.zip' );
	const tmpZipWriter = createWriteStream( tmpZip );

	// Set up the unzipper to unzip the archive when it finishes downloading.
	tmpZipWriter.on( 'finish', () => {
		const unzipper = new DecompressZip( tmpZip );

		unzipper.on( 'extract', buildWordPress );

		stdout.write( 'Extracting...\n' );

		unzipper.extract( {
			path: normalize( env.WP_DEVELOP_DIR ),
			strip: 1,
			filter: ( file ) => file.type !== 'Directory',
		} );
	} );

	stdout.write( 'Downloading...\n' );
	// Download the archive.
	request( 'https://github.com/WordPress/wordpress-develop/archive/master.zip' ).pipe( tmpZipWriter );
}

/**
 * Runs the appropriate build/install commands in the WordPress directory.
 */
function buildWordPress() {
	execSync( 'npm install', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	execSync( 'npm run env:start', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	if ( env.LOCAL_DIR === 'build' ) {
		execSync( 'npm run build', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	} else {
		execSync( 'npm run build:dev', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
	}
	execSync( 'npm run env:install', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );

	// Mount the plugin into the WordPress install.
	execSync( 'npm run env connect', { stdio: 'inherit' } );
	execSync( `npm run env cli plugin activate ${ env.npm_package_wp_env_plugin_dir }`, { stdio: 'inherit' } );
}
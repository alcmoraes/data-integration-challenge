const spawn = require( 'child_process' ).spawn;
const _ = require( 'lodash' );

/**
 * A really tiny utility class.
 */
class Utils {
    /**
     * Spawns a cmd on a different thread
     *
     * @param {string} cmd
     * @param {Array} args
     * @param {boolean} verbose
     * @return {Promise}
     */
    spawn( cmd, args, verbose = false ){
        return new Promise( ( resolve, reject ) => {
            let THREAD;
            THREAD = spawn( cmd, args );
            if( verbose ){
                THREAD.stdout.on( 'data', ( data ) => {
                    _.forEach( data.toString().split( /(\r?\n)/g ), ( d ) => console.log( d ) );
                } );
            }
            THREAD.on( 'close', ( code ) => {
                return code === 0 ? resolve() : reject();
            } );
        } );
    }
}

module.exports = new Utils();
const debug = require( 'debug' )( 'API:BIN:WWW' );
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * @return { void }
 */
( async function start(){
    let port;
    let server;
    try{
        server = await require( '../server/app' );
        
        debug( 'SERVER LOADED!' );
        
        server.listen( 3005, () => {
            debug( 'API running under port 3005 | Environment: ' + process.env.NODE_ENV );
        } );
    }
    catch( ERR ){
        debug( ERR );
        process.exit( 1 );
    }
} )();

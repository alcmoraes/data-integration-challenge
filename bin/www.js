const debug = require( 'debug' )( 'API:COMMAND:WWW' );
const restify = require( 'restify' );
const swagger = require( 'swagger-restify' );
const plugins = require( 'restify-plugins' );

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * @return { void }
 */
async function start(){
    let server;
    let port;
    try{
        server = restify.createServer();

        server.DB = await require( '../services/database' )();

        server.use( plugins.multipartBodyParser() );
        
        /*
        swagger.init( server, {
            swaggerVersion: '2.0',
            swaggerJSON: '/docs.json',
            swaggerUI: '/',
            basePath: 'http://localhost:3005/',
            info: {
                version: '1.0',
                title: 'API',
                description: 'API documentation',
            },
            apis: [
                './api/company.js',
            ],
        } );
        */
        
        await require( '../api/company' )( server );

        debug( 'SERVER LOADED!' );
        port = 3005;
        server.listen( port, () => {
            debug( 'API running under ' + port + ' | Environment: ' + process.env.NODE_ENV );
        } );
    }
    catch( ERR ){
        debug( ERR );
        process.exit( 1 );
    }
}

start();
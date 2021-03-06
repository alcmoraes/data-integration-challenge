const config = require( 'config' );
const restify = require( 'restify' );
const errors = require( 'restify-errors' );
const swagger = require( 'swagger-restify' );

module.exports = new Promise( async ( resolve, reject ) => {
    try{
        let server;

        server = restify.createServer();
          
        server.DB = await require( '../services/database' );

        server.pre( restify.pre.sanitizePath() );
        server.use( restify.acceptParser( server.acceptable ) );
        server.use( restify.queryParser() );
        server.use( restify.bodyParser() );

        server.use( restify.fullResponse() );

        server.on( 'MethodNotAllowed', ( req, res ) => {
            if( req.method.toLowerCase() === 'options' ){
                let origins = [
                    '*',
                ];
                let allowHeaders = [
                    'Access-Control-Allow-Origin',
                    'Accept-Version',
                    'Content-Language',
                    'Authorization',
                    'Content-Type',
                    'Accept',
                    'Api-Version',
                    'Origin',
                    'X-Requested-With',
                ];
                if( res.methods.indexOf( 'OPTIONS' ) === -1 ) res.methods.push( 'OPTIONS' );
                res.header( 'Access-Control-Allow-Credentials', true );
                res.header( 'Access-Control-Allow-Headers', allowHeaders.join( ', ' ) );
                res.header( 'Access-Control-Allow-Methods', res.methods.join( ', ' ) );
                res.header( 'Access-Control-Allow-Origin', origins.join( ', ' ) );
                return res.send( 204 );
            }
            return res.send( new errors.MethodNotAllowedError() );
        } );

        swagger.init( server, {
            swaggerVersion: '2.0',
            swaggerJSON: '/docs.json',
            swaggerUI: '/',
            basePath: config.get( 'host' ),
            info: {
                version: '1.0',
                title: 'Data Integration Challenge',
                description: 'API documentation',
            },
            apis: [
                './api/company.js',
            ],
        } );

        await require( '../api/company' )( server );

        return resolve( server );
    }
    catch( ERR ){
        return reject( ERR );
    }
} );
const debug = require( 'debug' )( 'API:MONGO:SERVICE' );
const config = require( 'config' );
const mongoose = require( 'mongoose' );

/**
 * Database service
 * @return {Promise} The database
 */
module.exports = () => {
    return new Promise( async ( resolve, reject ) => {
        try{
            let db;
            let models = {};

            mongoose.connect( config.get( 'database' ) );

            db = mongoose.connection;
            db.on( 'error', console.error.bind( console, 'connection error:' ) );

            db.once( 'open', function(){
                models[ 'Company' ] = mongoose.model( 'Company', require( '../schemas/company' )() );
                return resolve( { models, db } );
            } );
        }
        catch( ERR ){
            debug( ERR );
            reject( ERR );
        }
    } );
};
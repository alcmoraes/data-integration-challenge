const debug = require( 'debug' )( 'API:TASKS:BOOTSTRAP' );

let bootstrap = () => {
    return new Promise( async ( resolve, reject ) => {
        let mongoose;
        let collections;
        try{
            mongoose = await require( '../services/database' )();
            collections = await mongoose.db.db.collections();
            for( let collection of collections ) await collection.remove();
            await require( './mock/companies' )( mongoose );
            resolve();
        }
        catch( ERR ){
            debug( ERR );
            reject( ERR );
        }
    } );
};

bootstrap()
    .then( () => {
        process.exit( 2 );
    } )
    .catch( ( err ) => {
        console.log( err );
        process.exit( 1 );
    } );
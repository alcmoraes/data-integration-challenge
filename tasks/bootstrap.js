#!/bin/node

const debug = require( 'debug' )( 'API:TASKS:BOOTSTRAP' );
const utils = require( '../services/utils' );
const path = require( 'path' );

let bootstrap = () => {
    return new Promise( async ( resolve, reject ) => {
        let mongoose;
        let collections;
        try{
            mongoose = await require( '../services/database' );
            collections = await mongoose.db.db.collections();
            for( let collection of collections ) await collection.remove();
            
            await utils.spawn( 'node', [
                './tasks/import_from_file.js',
                `file=${path.join( __dirname, 'initial_data', 'q1_catalog.csv' )}`,
            ] );

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
        process.exit( 0 );
    } )
    .catch( ( ERR ) => {
        console.log( ERR );
        process.exit( 1 );
    } );
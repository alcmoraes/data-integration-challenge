#!/bin/node

const debug = require( 'debug' )( 'API:TASKS:BOOTSTRAP' );
const spawn = require( 'child_process' ).spawn;
const _ = require( 'lodash' );
const path = require( 'path' );

let bootstrap = () => {
    return new Promise( async ( resolve, reject ) => {
        let mongoose;
        let collections;
        let THREAD;
        try{
            mongoose = await require( '../services/database' );
            collections = await mongoose.db.db.collections();
            for( let collection of collections ) await collection.remove();
            
            THREAD = spawn( 'node', [
                './tasks/import_from_file.js',
                `file=${path.join( __dirname, 'initial_data', 'companies.csv' )}`,
            ] );

            THREAD.stdout.on( 'data', ( data ) => {
                _.forEach( data.toString().split( /(\r?\n)/g ), ( d ) => console.log( d ) );
            } );

            THREAD.on( 'close', ( code ) => {
                debug( `Bootstrap task finished with ${code === 0 ? 'success' : 'error'}` );
                resolve( code );
            } );
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
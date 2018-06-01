#!/bin/node

const debug = require( 'debug' )( 'API:WORKERS:IMPORTER' );
const spawn = require( 'child_process' ).spawn;
const fs = require( 'fs-extra' );
const schedule = require( 'node-schedule' );
const _ = require( 'lodash' );
const path = require( 'path' );

const lockPath = path.join( __dirname, 'lock' );
const uploadPaths = path.join( __dirname, '..', 'csv', 'uploaded' );
const importedPaths = path.join( __dirname, '..', 'csv', 'imported' );
const failedPaths = path.join( __dirname, '..', 'csv', 'failed' );

let start = async () => {
    debug( 'Importer worker running each 15s' );
    if( await fs.pathExists( lockPath ) ) await fs.unlink( lockPath );
    schedule.scheduleJob( '*/15 * * * * *', async () => {
        try{
            let uploadedCSVS;
            let csvToImport;
            let start;
            if( await fs.pathExists( lockPath ) ) throw new Error( 'Importer currently running. Abort.' );
            uploadedCSVS = await fs.readdir( uploadPaths );
            
            csvToImport = uploadedCSVS
                .filter( ( f ) => f.indexOf( '.csv' ) > -1 )
                .map( ( f ) => path.join( uploadPaths, f ) )
                .sort( ( a, b ) => fs.statSync( a ).ctime - fs.statSync( b ).ctime );
            
            if( !csvToImport.length ) throw new Error( 'Nothing to import.' );
            
            await fs.writeJson( lockPath, {} );
            
            csvToImport = csvToImport[ 0 ];

            debug( `Importing ${csvToImport}...` );
            start = Date.now();

            THREAD = spawn( 'node', [
                `${path.join( __dirname, '..', 'tasks', 'import_from_file.js' )}`,
                'merge=true',
                `file=${csvToImport}`,
            ] );
  
            THREAD.stdout.on( 'data', ( data ) => {
                _.forEach( data.toString().split( /(\r?\n)/g ), ( d ) => console.log( d ) );
            } );
  
            THREAD.on( 'close', async ( code ) => {
                if( code !== 0 ){
                    await fs.move( csvToImport, path.join( failedPaths, `${Date.now()}.csv` ) );
                    throw new Error( `Failed to import ${csvToImport}` );
                }
                else{
                    await fs.move( csvToImport, path.join( importedPaths, `${Date.now()}.csv` ) );
                    if( await fs.pathExists( lockPath ) ) await fs.unlink( lockPath );
                    debug( `DONE! ${Math.floor( ( Date.now() - start )/1000 )}s` );
                }
            } );
        }
        catch( ERR ){
            debug( ERR.message );
            if( await fs.pathExists( lockPath ) ) await fs.unlink( lockPath );
        }
    } );
};

start();
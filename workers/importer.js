#!/bin/node

const debug = require( 'debug' )( 'API:WORKERS:IMPORTER' );
const fs = require( 'fs-extra' );
const utils = require( '../services/utils' );
const schedule = require( 'node-schedule' );
const path = require( 'path' );

/**
 * A utility class to manage the CSV's
 * uploaded via api
 */
class ImporterWorker {
    /**
     * Constructor
     */
    constructor(){
        this.nextCSV = false;

        this.lockPath = path.join( __dirname, 'lock' );
        this.uploadPaths = path.join( __dirname, '..', 'csv', 'uploaded' );
        this.importedPaths = path.join( __dirname, '..', 'csv', 'imported' );
        this.failedPaths = path.join( __dirname, '..', 'csv', 'failed' );

        this.unlock();
    }

    /**
     * Writes the lockfile
     * @return {Promise}
     */
    lock(){
        return fs.writeJson( this.lockPath, {} );
    }

    /**
     * If is locked. Unlock it.
     * @return {void}
     */
    async unlock(){
        if( await this.isLocked() ) await fs.unlink( this.lockPath );
        return;
    }

    /**
     * Check if the lockfile exists
     * @return {Promise<boolean>}
     */
    isLocked(){
        return fs.pathExists( this.lockPath );
    }

    /**
     * Gets the next CSV from "uploaded" folder queue
     * @return {Promise<String>} The path for the next CSV to import
     */
    selectNextCSV(){
        return new Promise( async ( resolve, reject ) => {
            let uploadedCSVS;
            let csvToImport;
            try{
                uploadedCSVS = await fs.readdir( this.uploadPaths );
                csvToImport = uploadedCSVS
                    .filter( ( f ) => f.indexOf( '.csv' ) > -1 )
                    .map( ( f ) => path.join( this.uploadPaths, f ) )
                    .sort( ( a, b ) => fs.statSync( a ).ctime - fs.statSync( b ).ctime );
                this.nextCSV = csvToImport.shift() || false;
                resolve();
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }

    /**
     * Gets the next CSV on queue and
     * import it to the database
     * @return {Promise}
     */
    importNextCSV(){
        return new Promise( async ( resolve, reject ) => {
            let start;
            try{
                if( !this.nextCSV ) throw new Error( 'Nothing to import' );
                debug( `Import of ${this.nextCSV.split( '/' ).pop()} started!` );
                await this.lock();
                start = Date.now();
                await utils.spawn( 'node', [
                    'tasks/import_from_file.js',
                    `merge=${this.nextCSV.indexOf( '@merge-' ) > -1 ? 'true' : 'false'}`,
                    `file=${this.nextCSV}`,
                ] );
                await fs.move( this.nextCSV, path.join( this.importedPaths, `${start}.csv` ) );
                debug( `Well, that scalated quickly! It took me ${Math.floor( ( Date.now() - start )/1000 )}s.` );
                await this.unlock();
                resolve();
            }
            catch( ERR ){
                if( this.nextCSV ) await fs.move( this.nextCSV, path.join( this.failedPaths, `${Date.now()}.csv` ) );
                reject( ERR );
            }
        } );
    }
}

( () => {
    debug( 'Importer worker running each 15s' );
    schedule.scheduleJob( '*/15 * * * * *', async () => {
        let worker;
        worker = new ImporterWorker();
        try{
            await worker.selectNextCSV();
            await worker.importNextCSV();
            return true;
        }
        catch( ERR ){
            debug( ERR.message );
            await worker.unlock();
            return false;
        }
    } );
} )();
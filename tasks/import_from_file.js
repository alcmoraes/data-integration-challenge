const utils = require( '../services/utils' );
const path = require( 'path' );
const _ = require( 'lodash' );
const fs = require( 'fs-extra' );
let args = {};

if( process.argv[ 2 ] === 'help' ){
    console.log( [
        'This script imports a CSV into the database\n',
        'from a given CSV file path.\n\n',
    ].join( '' ) );
    console.log( 'Usage: ' );
    console.log( 'node import_from_file.js file=/path/to/file.csv' );
    console.log( '--------------------------------------------------------' );
    console.log( 'ARGUMENT    | DEFAULT | DESCRIPTION' );
    console.log( 'file        |         | The CSV path to import' );
    console.log( 'merge       | false   | Merge with existent companies?' );
    console.log( 'verbose     | false   | Debug mode' );
    console.log( '--------------------------------------------------------' );
    console.log( [
        'Obs:\n',
        'merge = false results in discarding CSV companies not found in database.',
    ].join( '' ) );
    process.exit( 1 );
}

process.argv.splice( 2 ).map( ( d ) => {
    let prop;
    let val;
    [ prop, val ] = d.split( '=' );
    if( [ 'true', 'false' ].indexOf( val ) > -1 ) val = val == 'true' ? true : false;
    if( !_.isEmpty( prop ) ) args[ prop ] = val || false;
} );

/**
 * The CSV Importer Turbo 3000!
 */
class Importer {
    /**
     * @param {Object} options An array of options to configure the importer
     */
    constructor( options ){
        this.options = Object.assign( {},
            {
                file: false, // The CSV filepath to import
                merge: false, // Shall we merge the company data instead of import new ones?
                verbose: false, // Debug important info
            }, options );
        this.filePath = path;
        this.db = false; // The mongo instance
        this.csvString = null; // The CSV as string
        this.csvData = null; // The CSV organized
        this.ensureOptions();
    }

    /**
     * Debug data
     * @param {string} message
     * @return {boolean}
     */
    verbose( message ){
        if( this.options.verbose ) console.log( message );
        return true;
    }

    /**
     * Organizes and ensure options given are correct
     */
    ensureOptions(){
        try{
            if( !this.options.file ) throw new Error( 'Missing CSV file argument!' );
            // Relative path fix
            if( this.options.file[ 0 ] !== '/' ) this.options.file = path.join( __dirname, this.options.file );
        }
        catch( ERR ){
            this.verbose( ERR.message );
            throw new ERR;
        }
    }

    /**
     * As the method name says.
     * Loads the database and the csv string
     * @return {Promise}
     */
    loadDatabaseAndCsvString(){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.db = await require( '../services/database' );
                this.csvString = await fs.readFile( this.options.file, { encoding: 'utf-8' } );
                resolve();
            }
            catch( ERR ){
                this.verbose( ERR );
                reject( ERR );
            }
        } );
    }

    /**
     * Organizes the CSV
     * @return {Promise}
     */
    organizeCSV(){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.csvData = await utils.readCsv( this.csvString, {
                    name: {
                        required: true,
                        regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
                    },
                    zip: { required: true, regex: /[0-9]{5}/ },
                    website: {
                        required: this.options.merge,
                        regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
                    },
                } );
                if( !this.csvData.length ) throw new Error( 'No companies match' );
                resolve();
            }
            catch( ERR ){
                this.verbose( ERR );
                reject( ERR );
            }
        } );
    }

    /**
     * Generates a mongo find condition
     * to match a company on database
     * @param {Object} company
     * @return {Object}
     */
    generateMongoFindConditions( company ){
        let conditions;
        conditions = {
            name: { $regex: `^${company.name}\s?.*`, $options : 'i' },
        };
        if( company.zip ) conditions[ 'zip' ] = company.zip;
        return conditions;
    }

    /**
     * Inserts a new company in the database
     * @param {Object} company
     * @return {Promise}
     */
    createCompany( company ){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.verbose( `Creating company: ${company.name}...` );
                company = new this.db.models.Company( company );
                await company.save();
                return resolve();
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }

    /**
     * Merges a company with an existent one
     * @param {String} companyId The ID of the company to merge
     * @param {Object} values The values to update on the existent company
     * @return {Promise}
     */
    mergeCompany( companyId, values ){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.verbose( `Updating ${companyId}...` );
                await this.db.models.Company.update( { _id: companyId }, {
                    $set: values,
                } );
                return resolve();
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }

    /**
     * Picks the next company from the array
     *
     * @param {Object} company
     * @return {any}
     */
    importCompany( company ){
        return new Promise( async ( resolve, reject ) => {
            let conditions;
            let matchingCompanies;
            try{
                conditions = this.generateMongoFindConditions( company );
                matchingCompanies = await this.db.models.Company.find( conditions );
                if( ( !matchingCompanies.length && this.options.merge ) || matchingCompanies.length > 1 ){
                    return resolve();
                }
                if( !matchingCompanies.length && !this.options.merge ){
                    await this.createCompany( company );
                    return resolve();
                }
                if( matchingCompanies.length ){
                    if( this.options.merge && company.website !== matchingCompanies[ 0 ].website ){
                        await this.mergeCompany( matchingCompanies[ 0 ]._id, { website: company.website } );
                    }
                    return resolve();
                }
            }
            catch( ERR ){
                this.verbose( ERR );
                return resolve();
            }
        } );
    };
}

( async () => {
    try{
        let importer = new Importer( args );
        console.log( importer.file );
        await importer.loadDatabaseAndCsvString();
        await importer.organizeCSV();
        await importer.importCompany( importer.csvData[ 0 ] );
        await Promise.all( importer.csvData.map( ( c ) => importer.importCompany( c ) ) );
        console.log( 'DONE!' );
        process.exit( 0 );
    }
    catch( ERR ){
        console.log( 'Task exited with errors' );
        process.exit( 1 );
    }
} )();
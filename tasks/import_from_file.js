const debug = require( 'debug' )( 'API:TASKS:IMPORT_COMPANIES_FROM_FILE' );
const utils = require( '../services/utils' );
const path = require( 'path' );
const _ = require( 'lodash' );
const fs = require( 'fs-extra' );
const defaults = {
    merge: false,
    verbose: false,
};

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

args = _.merge( defaults, args );

if( !args.file ){
    debug( 'Missing CSV file! See help for possible arguments' );
    process.exit( 1 );
}

if( args.file[ 0 ] !== '/' ) args.file = path.join( __dirname, args.file );

let verbose = ( message ) => args.verbose ? console.log( message ) : false;

let start = () => {
    return new Promise( async ( resolve, reject ) => {
        let csvString;
        let db;
        let company;
        let conditions;
        let data;
        let matchingCompanies;
        try{
            db = await require( '../services/database' );
            csvString = await fs.readFile( args.file, { encoding: 'utf-8' } );

            data = await utils.readCsv( csvString, {
                name: {
                    required: true,
                    regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
                },
                zip: { required: true, regex: /[0-9]{5}/ },
                website: {
                    required: args.merge,
                    regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
                },
            } );
            
            /**
             * Picks the next company from the array
             *
             * @return {any}
             */
            let importCompany = async () => {
                try{
                    if( !data.length ){
                        verbose( 'Finished parsing!' );
                        return resolve();
                    }
                    company = data.shift();
                    conditions = {
                        name: {
                            $regex: `^${company.name}\s?.*`,
                            $options : 'i',
                        },
                    };
                    if( company.zip ) conditions[ 'zip' ] = company.zip;
                    matchingCompanies = await db.models.Company.find( conditions );

                    if( !matchingCompanies.length && args.merge ) return importCompany();
                    
                    if( matchingCompanies.length > 1 ){
                        verbose( 'Multiple companies match. Skip.' );
                        return importCompany();
                    }
                    
                    if( !matchingCompanies.length && !args.merge ){
                        verbose( `Company ${company.name} not found. Inserting...` );
                        company = new db.models.Company( company );
                        await company.save();
                        return importCompany();
                    }

                    if( matchingCompanies.length ){
                        if(
                            !args.merge ||
                            company.website == matchingCompanies[ 0 ].website
                        ) return importCompany();

                        verbose( `Company ${company.name} match!. Updating website...` );
                        await db.models.Company.update( {
                            _id: matchingCompanies[ 0 ]._id,
                        }, {
                            $set: { website: company.website },
                        } );
                        return importCompany();
                    }
                }
                catch( ERR ){
                    verbose( ERR );
                    return importCompany();
                }
            };

            verbose( `Preparing to ${Boolean( args.merge ) ? 'merge' : 'import'} ${data.length} companies...` );

            return importCompany();
        }
        catch( ERR ){
            console.log( ERR.message );
            reject( ERR );
        }
    } );
};

start()
    .then( () => {
        debug( 'DONE!' );
        process.exit( 0 );
    } )
    .catch( ( ERR ) => {
        debug( ERR );
        process.exit( 1 );
    } );
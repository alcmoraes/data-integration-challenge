const _ = require( 'lodash' );
const Importer = require( '../services/importer' );

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

( async () => {
    try{
        if( !args.file ) throw new Error( 'Missing CSV file argument!' );
        
        args.columns = { // The column matching pattern for a CSV of companies
            name: {
                required: true,
                regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
            },
            zip: { required: true, regex: /[0-9]{5}/ },
            website: {
                required: args.merge || false,
                regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
            },
        };

        let importer = new Importer( args );
        await importer.loadDatabase();
        await importer.readCsv();
        await Promise.all( importer.csvData.map( ( c ) => importer.importCompany( c ) ) );
        console.log( 'DONE!' );
        process.exit( 0 );
    }
    catch( ERR ){
        console.log( ERR );
        console.log( 'Task exited with errors' );
        process.exit( 1 );
    }
} )();
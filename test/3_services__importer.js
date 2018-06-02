const path = require( 'path' );
const assert = require( 'assert' );
const Importer = require( '../services/importer' );

describe( 'Importer utility class', () => {
    before( () => {
        global.importer = new Importer( { verbose: true, columns: {
            name: {
                required: true,
                regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
            },
            zip: { required: true, regex: /[0-9]{5}/ },
            website: {
                required: false,
                regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
            },
        } } );
        return global.importer.loadDatabase();
    } );

    it( 'Trying to read a non given file trigger errors', async () => {
        try{
            global.importer.setOptions( { verbose: false } );
            await global.importer.readCsv();
        }
        catch( ERR ){
            assert.equal( ERR.message, 'No file specified to read!' );
        }
    } );

    it( 'Import should work with relative paths', async () => {
        await global.importer.readCsv( path.join( '..', 'test', 'mock', 'single.csv' ) );
        return Promise.all( global.importer.csvData.map( ( c ) => importer.importCompany( c ) ) );
    } );

    it( 'Import empty csv file trigger errors', async () => {
        try{
            await global.importer.readCsv( path.join( '..', 'test', 'mock', 'blank.csv' ) );
        }
        catch( ERR ){
            assert.equal( ERR.message, 'Empty csv' );
        }
    } );

    it( 'Import a large file successfully', async () => {
        await global.importer.readCsv( path.join( __dirname, 'mock', 'large_csv_to_import.csv' ) );
        return Promise.all( global.importer.csvData.map( ( c ) => importer.importCompany( c ) ) );
    } );

    it( 'Merge a large file successfully', async () => {
        global.importer.setOptions( { merge: true, columns: {
            name: {
                required: true,
                regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
            },
            zip: { required: true, regex: /[0-9]{5}/ },
            website: {
                required: true,
                regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
            },
        } } );
        await global.importer.readCsv( path.join( __dirname, 'mock', 'large_csv_to_merge.csv' ) );
        return Promise.all( global.importer.csvData.map( ( c ) => importer.importCompany( c ) ) );
    } );
} );



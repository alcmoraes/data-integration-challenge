const _ = require( 'lodash' );
const fs = require( 'fs' );
const parseCSV = require( 'csv-parse' );

/**
 * A really tiny utility class.
 */
class Utils {
    /**
     * Parses a CSV from a given CSV File data
     * @param {string} csvData
     * @param {Object} options
     * @return { Promise<Array<Array>> }
     */
    readCsv( csvData, options ){
        return new Promise( ( resolve, reject ) => {
            parseCSV( csvData, options, ( err, data ) => {
                if( err ) return reject( err );
                return resolve( data );
            } );
        } );
    }
    /**
     * Reads a file from a given file path
     * @param {string} filepath
     * @param {Object} options
     * @return { string }
     */
    readFile( filepath, options ){
        return new Promise( ( resolve, reject ) => {
            fs.readFile( filepath, options, ( err, data ) => {
                if( err ) return reject( err );
                return resolve( data );
            } );
        } );
    }
    /**
     * Use it to format companies got from a CSV file
     *
     * @param {Array<Object>} data
     * @return {Array<Object>}
     */
    formatCompaniesFromCSV( data ){
        return data.filter( ( d ) => {
            return d[ 0 ] && d[ 0 ].length && d[ 1 ] && d[ 1 ].length === 5;
        } ).map( ( c ) => {
            return{
                name: _.startCase( c[ 0 ] ),
                zip: c[ 1 ],
                website: c[ 2 ] || null,
            };
        } );
    }
}

module.exports = new Utils();
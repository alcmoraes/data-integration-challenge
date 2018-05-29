const _ = require( 'lodash' );

/**
 * A really tiny utility class.
 */
class Utils {
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
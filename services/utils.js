const _ = require( 'lodash' );
const CSV = require( 'csv-string' );

/**
 * A really tiny utility class.
 */
class Utils {
    /**
     * Parses a CSV from a given CSV File data
     * @param {string} csvString
     * @param {Object} columns a Regular expression collection to match the CSV
     * @return { Promise } Arra<Array> or Array<Object>, depending on the columns parameter
     */
    readCsv( csvString, columns = {} ){
        return new Promise( ( resolve, reject ) => {
            let data;
            let columnOrder = [];
            try{
                if( _.isEmpty( columns ) ) throw new Error( '`columns` property cannot be empty!' );
                data = CSV.parse( csvString );
                if( !data.length ) throw new Error( 'Empty csv' );
                /**
                 * Checks for the first valid row that matches
                 * the columns specification and stores the position
                 * of each column.
                 *
                 * That way, we can accept CSV's with any formation
                 * (I hope so)
                 *
                 * @return {void}
                 */
                let guessColumnPositions = () => {
                    let entity = data.shift();
                    _.forEach( columns, ( prop, col ) => {
                        let match;
                        let regex = prop.hasOwnProperty( 'regex' ) ? prop.regex : prop;
                        match = _.find( entity,
                            ( entry ) => entry.match( regex ) );
                        if( match ){
                            columnOrder.push( {
                                name: col,
                                required: prop.required,
                                pos: entity.indexOf( match ),
                                regex,
                            } );
                        }
                        if( !match && prop.required ){
                            columnOrder = [];
                            return false;
                        }
                    } );
                    if( !columnOrder.length ) return guessColumnPositions();
                    data.unshift( entity );
                };

                guessColumnPositions();

                data.filter( ( company ) => {
                    let should = true;
                    columnOrder.map( ( o, i ) => {
                        if( ( !company[ o.pos ] && o.required ) ||
                            ( !company[ o.pos ].match( o.regex ) && o.required )
                        ) should = false;
                    } );
                    return should;
                } );

                resolve( data.reduce( ( output, company ) => {
                    let c = {};
                    columnOrder.map( ( o, i ) => {
                        if( ( !company[ o.pos ] && o.required ) ||
                            ( !company[ o.pos ].match( o.regex ) && o.required )
                        ) return;
                        c[ o.name ] = company[ o.pos ];
                    } );
                    return Object.keys( c ).length === columnOrder.length ?
                        [ ...output, c ] : output;
                }, [] ) );
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }
}

module.exports = new Utils();
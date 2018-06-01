const spawn = require( 'child_process' ).spawn;
const _ = require( 'lodash' );
const CSV = require( 'csv-string' );

/**
 * A really tiny utility class.
 */
class Utils {
    /**
     * Spawns a cmd on a different thread
     *
     * @param {string} cmd
     * @param {Array} args
     * @param {boolean} verbose
     * @return {Promise}
     */
    spawn( cmd, args, verbose = false ){
        return new Promise( ( resolve, reject ) => {
            let THREAD;
            THREAD = spawn( cmd, args );
            if( verbose ){
                THREAD.stdout.on( 'data', ( data ) => {
                    _.forEach( data.toString().split( /(\r?\n)/g ), ( d ) => console.log( d ) );
                } );
            }
            THREAD.on( 'close', ( code ) => {
                return code === 0 ? resolve() : reject();
            } );
        } );
    }

    /**
     * Checks for the first valid row that matches
     * the columns specification and stores the position
     * of each column.
     *
     * That way, we can accept CSV's with any formation
     * (I hope so)
     *
     * @param {Array} data The array of given companies extracted from CSV
     * @param {Object} columns The column rule for matching data
     * @param {function} cb The callback to execute before finishing it
     * @return {function}
     */
    guessColumnPositions( data, columns, cb ){
        try{
            let columnOrder = [];
            let entity = data.shift();
            _.forEach( columns, ( prop, col ) => {
                let match;
                let regex = prop.hasOwnProperty( 'regex' ) ? prop.regex : prop;
                match = _.find( entity, ( entry ) => entry.match( regex ) );
                if( match ){
                    columnOrder.push( { name: col, required: prop.required,
                        pos: entity.indexOf( match ),
                        regex } );
                }
                if( !match && prop.required ) return columnOrder = [] && false;
            } );
            if( !columnOrder.length ) return this.guessColumnPositions( data, columns, cb );
            return data.unshift( entity ) && cb( null, columnOrder );
        }
        catch( ERR ){
            return cb( ERR );
        }
    };

    /**
     * Parses a CSV from a given CSV File data
     * @param {string} csvString
     * @param {Object} columns a Regular expression collection to match the CSV
     * @return { Promise } Arra<Array> or Array<Object>, depending on the columns parameter
     */
    readCsv( csvString, columns = {} ){
        return new Promise( async ( resolve, reject ) => {
            let data;
            try{
                if( _.isEmpty( columns ) ) throw new Error( '`columns` property cannot be empty!' );
                data = CSV.parse( csvString );
                if( !data.length ) throw new Error( 'Empty csv' );
                this.guessColumnPositions( data, columns, ( err, columnOrder ) => {
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
                } );
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }
}

module.exports = new Utils();
const path = require( 'path' );
const _ = require( 'lodash' );
const fs = require( 'fs-extra' );
const CSV = require( 'csv-string' );

/**
 * The CSV Importer Turbo 3000!
 *
 * Handy tool to manage the import of companies
 * to a mongo database
 */
module.exports = class Importer {
    /**
   * @param {Object} options An array of options to configure the importer
   */
    constructor( options ){
        this.options = {
            file: false, // The CSV filepath to import
            merge: false, // Shall we merge the company data instead of import new ones?
            verbose: false, // Debug important info
            columns: false, // An object describing how deal with the CSV
        };
        
        this.options = _.merge( this.options, options );
        this.db = false; // The mongo instance
        this.csvString = null; // The CSV as string
        this.csvData = null; // The CSV organized
        this.ensureOptions();
    }

    /**
     * Override the already set options
     *
     * @param {Object} options
     * @return {boolean}
     */
    setOptions( options ){
        this.options = _.merge( this.options, options );
        this.ensureOptions();
        return true;
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
     * Parses a CSV from a given CSV file path
     * @param {string} file The file path to read from
     * @return { Promise } Array<Array> or Array<Object>, depending on the columns parameter
     */
    readCsv( file = this.options.file ){
        return new Promise( async ( resolve, reject ) => {
            let data;
            try{
                if( !file ) throw new Error( 'No file specified to read!' );
                if( file !== this.options.file ){
                    this.setOptions( { file: file } );
                }
                this.csvString = await fs.readFile( this.options.file, { encoding: 'utf-8' } );
                data = CSV.parse( this.csvString );
                if( !data.length || data[ 0 ][ 0 ] === '' ) throw new Error( 'Empty csv' );
                
                if( _.isEmpty( this.options.columns ) ){
                    this.csvData = data;
                    return resolve();
                }

                this.guessColumnPositions( data, this.options.columns, ( err, columnOrder ) => {
                    this.csvData = data.reduce( ( output, company ) => {
                        let c = {};
                        columnOrder.map( ( o, i ) => {
                            if( ( !company[ o.pos ] && o.required ) ||
                                ( !company[ o.pos ].match( o.regex ) && o.required )
                            ) return;
                            c[ o.name ] = company[ o.pos ];
                        } );
                        return Object.keys( c ).length === columnOrder.length ?
                            [ ...output, c ] : output;
                    }, [] );
                    resolve();
                } );
            }
            catch( ERR ){
                reject( ERR );
            }
        } );
    }

    /**
     * Organizes and ensure options given are correct
     */
    ensureOptions(){
        try{
            // Relative path fix
            if( this.options.file && this.options.file[ 0 ] !== '/' ){
                this.options.file = path.join( __dirname, this.options.file );
            }
            // Other future checks...
        }
        catch( ERR ){
            this.verbose( ERR.message );
            throw new ERR;
        }
    }

    /**
     * As the method name says.
     * @return {Promise}
     */
    loadDatabase(){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.db = await require( './database' );
                this.verbose( 'Database loaded' );
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
     * @param {Object} company The company object
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
     * Lookup in the database and depending
     * on the strategy adopted (merge or import)
     * it imports the given company in the
     * database
     *
     * @param {Object} company The company object
     * @param {boolean} rejectOnFailure If running inside a loop, you maybe don't want
     *                                  to throw errors on an unsuccessful transaction.
     *                                  If that's the case. Keep it as `false`
     * @return {any}
     */
    importCompany( company, rejectOnFailure = false ){
        return new Promise( async ( resolve, reject ) => {
            let conditions;
            let matchingCompanies;
            try{
                conditions = this.generateMongoFindConditions( company );
                matchingCompanies = await this.db.models.Company.find( conditions );
                if( ( !matchingCompanies.length && this.options.merge ) || matchingCompanies.length > 1 ){
                    if( rejectOnFailure ){
                        if( matchingCompanies.length > 1 ) throw new Error( 'Multiple companies match the given data' );
                        throw new Error( 'Nothing to merge' );
                    }
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
                return rejectOnFailure ? reject( ERR ) : resolve();
            }
        } );
    };
};
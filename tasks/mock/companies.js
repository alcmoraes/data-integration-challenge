const fs = require( 'fs' );
const path = require( 'path' );
const debug = require( 'debug' )( 'API:TASKS:MOCK:COMPANIES' );
const parse = require( 'csv-parse' );
const utils = require( '../../services/utils' );
const Joi = require( 'joi' );

const schema = Joi.object().keys( {
    'name': Joi.string().max( 255 ),
    'zip': Joi.string().min( 5 ).max( 5 ),
    'website': Joi.string().max( 255 ).allow( null ).optional(),
} );

module.exports = ( db ) => {
    return new Promise( async ( resolve, reject ) => {
        let parser;
        try{
            parser = parse( { delimiter: ';' }, async ( err, data ) => {
                if( err ) throw new Error( err );
                data = utils.formatCompaniesFromCSV( data );
                
                /**
                 * Stores a company object into
                 * mongo
                 *
                 * @return {any}
                 */
                async function putCompany(){
                    try{
                        let company;
                        if( !data.length ) return resolve();
                        company = new db.models.Company( data.shift() );
                        await company.save();
                        return putCompany();
                    }
                    catch( ERR ){
                        throw new Error( ERR );
                    }
                };

                return putCompany();
            } );

            fs.createReadStream( path.join( __dirname, 'companies.csv' ) ).pipe( parser );
        }
        catch( ERR ){
            debug( ERR );
            reject( ERR );
        }
    } );
};
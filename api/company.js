const config = require( 'config' );
const fs = require( 'fs' );
const errors = require( 'restify-errors' );
const debug = require( 'debug' )( 'API:COMPANY' );
const parseCSV = require( 'csv-parse' );
const Joi = require( 'joi' );
const _ = require( 'lodash' );
const utils = require( '../services/utils' );

const schema = Joi.object().keys( {
    'name': Joi.string().max( 255 ),
    'zip': Joi.string().min( 5 ).max( 5 ),
    'website': Joi.string().max( 255 ).allow( null ).optional(),
} );

/**
 * @swagger
 * resourcePath: /company
 * description: API endpoints for company entity
 *
 * @param { Restify } server Restify server
 * @return { Promise }
 */
module.exports = ( server ) => {
    return new Promise( ( resolve, reject ) => {
        /**
         * @swagger
         * path: /company/upload
         * operations:
         *   -  httpMethod: POST
         *      summary: Accepts a CSV input
         *      responseClass: String
         *      nickname: upload_companies
         *      consumes:
         *        - multipart/form-data
         *      parameters:
         *        - name: file
         *          in: formData
         *          description: The CSV file
         *          required: true
         *          paramType: body
         *          type: file
        */
        server.post( {
            name: 'upload_companies',
            path: '/companies/upload',
            version: '1.0.0',
        },
        ( req, res, next ) => {
            let uploadedCSV;
            let company;
            try{
                uploadedCSV = req.files.file;
                fs.readFile( uploadedCSV.path, { encoding: 'utf-8' }, ( err, uploadedData ) =>{
                    if( err ) throw new errors.InvalidContentError( err );
                    parseCSV( uploadedData, { delimiter: ';' }, async ( err, csvCompanies ) => {
                        if( err ) throw new errors.UnprocessableEntityError( err );
                        csvCompanies = utils.formatCompaniesFromCSV( csvCompanies );
                        /**
                         * Picks the next company from the array
                         * and store it into the database
                         *
                         * @return { void }
                         */
                        async function storeNextCompany(){
                            let c;
                            try{
                                if( !csvCompanies.length ) return res.send( { status: 'OK', message: 'Uploaded successfully!' } );
                                c = csvCompanies.shift();
                                let company = await server.DB.models.Company.findOneAndUpdate( {
                                    name: { $regex: `^${c.name}\s?.*`, $options : 'i' },
                                    zip: c.zip,
                                },
                                { $set: { website: c.website } } );
                                return storeNextCompany();
                            }
                            catch( ERR ){
                                debug( ERR );
                                throw new Error( ERR );
                            }
                        }

                        return await storeNextCompany();
                    } );
                } );
            }
            catch( ERR ){
                debug( ERR );
                return res.send( ERR );
            }
        } );

        resolve( server );
    } );
};
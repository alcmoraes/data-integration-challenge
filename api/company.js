const errors = require( 'restify-errors' );
const debug = require( 'debug' )( 'API:COMPANY' );
const Joi = require( 'joi' );
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
         * path: /companies/upload
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
        async ( req, res, next ) => {
            let uploadedCSV;
            let company;
            try{
                uploadedCSV = req.files.file;
                if( uploadedCSV.type !== 'text/csv' ) throw new errors.InvalidContentError( 'CSV files only' );
                let uploadedData = await utils.readFile( uploadedCSV.path, { encoding: 'utf-8' } );
                let csvCompanies = await utils.readCsv( uploadedData, { delimiter: ';' } );
                if( !csvCompanies.length ) throw new errors.InvalidContentError( 'Invalid or empty CSV' );
                csvCompanies = utils.formatCompaniesFromCSV( csvCompanies );
                /**
                 * Picks the next company from the array
                 * and store it into the database
                 *
                 * @return { void }
                 */
                function storeNextCompany(){
                    return new Promise( async ( resolve, reject ) => {
                        let c;
                        if( !csvCompanies.length ) return resolve( res.send( { status: 'OK', message: 'Uploaded successfully!' } ) );
                        c = csvCompanies.shift();
                        let company = await server.DB.models.Company.findOneAndUpdate( {
                            name: { $regex: `^${c.name}\s?.*`, $options : 'i' },
                            zip: c.zip,
                        },
                        { $set: { website: c.website } } );
                        return await storeNextCompany();
                    } );
                }

                return await storeNextCompany();
            }
            catch( ERR ){
                return res.send( ERR );
            }
        } );

        resolve( server );
    } );
};
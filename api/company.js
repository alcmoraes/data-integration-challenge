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
         * models:
         *   Company:
         *     id: Company
         *     type: object
         *     properties:
         *       name:
         *         type: String
         *       zip:
         *         type: String
         *       website:
         *         type: String
         *     required:
         *       - name
         *     example:
         *       name: "Fakeblock"
         *       zip: "90776"
         *       website: "https://fakeblock.com.br"
         */

        /**
          * @swagger
          * definitions:
          *   uploadResponse:
          *     type: "object"
          *     description: "Upload Object Response"
          *     properties:
          *       status:
          *         type: String
          *         description: "OK or ERROR"
          *         default: "OK"
          *       message:
          *         type: String
          *         description: "A descriptive message of the action taken"
          *         default: "Uploaded successfully!"
          *   Company:
          *     properties:
          *       id:
          *         type: String
          *         readOnly: true
          *       name:
          *         type: String
          *       zip:
          *         type: String
          *       website:
          *         type: String
          *     required:
          *       - name
          *       - zip
          *       - website
          */

        /**
         * @swagger
         * path: /companies/upload
         * operations:
         *   -  httpMethod: POST
         *      summary: Upload companies CSV
         *      notes: It uses the companies from the CSV to merge matching companies on the database
         *      operationId: "upload_companies"
         *      responseClass: String
         *      nickname: upload_companies
         *      produces:
         *        - "application/json"
         *      consumes:
         *        - multipart/form-data
         *      responses:
         *        200:
         *          description: "SUCCESS. The request has been fulfilled and resulted in response."
         *          schema:
         *            $ref: "#/definitions/uploadResponse"
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

        /**
         * @swagger
         * path: /companies
         * operations:
         *   -  httpMethod: POST
         *      summary: Merge company
         *      notes: It uses `name` and `zip` parameter to find a matching company in the database and merge the `website` data in it
         *      operationId: "create_company"
         *      responseClass: String
         *      nickname: create_company
         *      produces:
         *        - application/json
         *      consumes:
         *        - application/json
         *      responses:
         *        200:
         *          description: "Success"
         *          schema:
         *            $ref: "#/definitions/uploadResponse"
         *      parameters:
         *        - name: company
         *          in: formData
         *          description: The company object to merge
         *          required: true
         *          paramType: body
         *          type: Company
         *          schema:
         *            $ref: "#/definitions/Company"
        */
        server.post( {
            name: 'create_company',
            path: '/companies/upload',
            version: '1.0.0',
        },
        async ( req, res, next ) => {
            
        } );

        resolve( server );
    } );
};
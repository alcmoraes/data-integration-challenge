const errors = require( 'restify-errors' );
const debug = require( 'debug' )( 'API:COMPANY' );
const _ = require( 'lodash' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const Importer = require( '../services/importer' );
const Joi = require( 'joi' );

const schema = Joi.object().keys( {
    'name': Joi.string().max( 255 ).required().regex( /^([ \u00c0-\u01ff0-9a-zA-Z\&,\.'\-])+$/ ),
    'zip': Joi.string().min( 5 ).max( 5 ).required().regex( /[0-9]{5}/ ),
    'website': Joi.string().max( 255 ).optional().regex( /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/ ),
    'format': Joi.string().regex( /^(merge|import)$/ ).optional(),
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
         *         defaultValue: "Fakeblock"
         *         description: "The company name"
         *       zip:
         *         type: String
         *         defaultValue: "90776"
         *         description: "The company zipcode"
         *       website:
         *         type: String
         *         description: "The company website"
         *         defaultValue: "https://fakeblock.com.br"
         *       format:
         *         type: String
         *         enum: [ "merge", "import" ]
         *         description: "Defines the import strategy"
         *         defaultValue: "merge"
         *     required:
         *       - name
         */

        /**
         * @swagger
         * path: /companies/upload
         * operations:
         *   -  httpMethod: POST
         *      summary: Import from CSV
         *      notes: It uses the companies from the CSV to merge or import it to the database.
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
         *          paramType: file
         *          type: file
         *        - name: format
         *          in: formData
         *          description: "If `merge` it will discard companies not found on database."
         *          required: false
         *          defaultValue: "merge"
         *          paramType: form
         *          enum: [ "merge", "import" ]
         *          type: string
        */
        server.post( {
            name: 'upload_companies',
            path: '/companies/upload',
            version: '1.0.0',
        },
        async ( req, res, next ) => {
            let uploadedCSV;
            try{
                uploadedCSV = req.files.file;
                if( uploadedCSV.type !== 'text/csv' ) throw new errors.InvalidContentError( 'CSV files only' );
                await fs.move( uploadedCSV.path, path.join( __dirname, '..', 'csv', 'uploaded', `${Date.now()}.csv` ) );
                return res.send( { status: 'OK', message: 'CSV added to queue' } );
            }
            catch( ERR ){
                debug( ERR );
                return res.send( ERR );
            }
        } );

        /**
         * @swagger
         * path: /companies/new
         * operations:
         *   -  httpMethod: POST
         *      summary: Import from form
         *      notes: Creates a new company or merge it with an existent one.
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
        */
        server.post( {
            name: 'create_company',
            path: '/companies/new',
            version: '1.0.0',
        },
        async ( req, res, next ) => {
            try{
                if( !req.body.format ) req.body.format = 'merge'; // Defaults to merge
                await Joi.validate( req.body, schema );
                let importer = new Importer( { merge: req.body.format === 'merge' } );
                await importer.loadRequirements();
                await importer.importCompany( _.omit( req.body, 'format' ), true );
                return res.send( { status: 'OK', message: 'Done!' } );
            }
            catch( ERR ){
                debug( ERR );
                return res.send( ERR );
            }
        } );

        resolve( server );
    } );
};
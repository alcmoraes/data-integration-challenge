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
         *   CompanyFind:
         *     id: CompanyFind
         *     type: object
         *     properties:
         *       name:
         *         type: String
         *         defaultValue: "Face"
         *         description: "The company you would like to search. Works if you have only the first name (e.g.: `Melanie` for `Melanie & Brothers Co.`)"
         *       zip:
         *         type: String
         *         defaultValue: "90776"
         *         description: "The zipcode of the company you're looking for"
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
            let csvName = `@merge-${Date.now()}`;
            try{
                uploadedCSV = req.files.file;
                if( uploadedCSV.type !== 'text/csv' ) throw new errors.InvalidContentError( 'CSV files only' );
                if( req.body.format ){
                    await Joi.validate( req.body.format, Joi.string().regex( /^(merge|import)$/ ).optional() );
                    csvName = req.body.format !== 'merge' ? `@${req.body.format}-${Date.now()}` : csvName;
                }
                await fs.move( uploadedCSV.path, path.join( __dirname, '..', 'csv', 'uploaded', `${csvName}.csv` ) );
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
                await importer.loadDatabase();
                await importer.importCompany( _.omit( req.body, 'format' ), true );
                return res.send( { status: 'OK', message: 'Done!' } );
            }
            catch( ERR ){
                debug( ERR );
                return res.send( ERR );
            }
        } );

        /**
         * @swagger
         * path: /companies
         * operations:
         *   -  httpMethod: POST
         *      summary: Finds a company
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
         *          type: CompanyFind
        */
        server.post( {
            name: 'find_company',
            path: '/companies',
            version: '1.0.0',
        },
        async ( req, res, next ) => {
            try{
                let matches;
                await Joi.validate( req.body, schema );
                matches = await server.DB.models.Company.find( {
                    name: { $regex: `^${req.body.name}\s?.*`, $options : 'i' },
                    zip: req.body.zip,
                } );
                return res.send( { status: 'OK', data: matches } );
            }
            catch( ERR ){
                debug( ERR );
                return res.send( ERR );
            }
        } );

        resolve( server );
    } );
};
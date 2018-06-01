const utils = require( './utils' );
const path = require( 'path' );
const fs = require( 'fs-extra' );

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
        this.options = Object.assign( {},
            {
                file: false, // The CSV filepath to import
                merge: false, // Shall we merge the company data instead of import new ones?
                verbose: false, // Debug important info
            }, options );
        this.filePath = path;
        this.db = false; // The mongo instance
        this.csvString = null; // The CSV as string
        this.csvData = null; // The CSV organized
        this.ensureOptions();
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
   * Organizes and ensure options given are correct
   */
    ensureOptions(){
        try{
            // Relative path fix
            if( this.options.file && this.options.file[ 0 ] !== '/' ){
                this.options.file = path.join( __dirname, this.options.file );
            }
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
    loadRequirements(){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.db = await require( './database' );
                if( this.options.file ){
                    this.csvString = await fs.readFile( this.options.file, { encoding: 'utf-8' } );
                }
                resolve();
            }
            catch( ERR ){
                this.verbose( ERR );
                reject( ERR );
            }
        } );
    }

    /**
   * Organizes the CSV
   * @return {Promise}
   */
    organizeCSV(){
        return new Promise( async ( resolve, reject ) => {
            try{
                this.csvData = await utils.readCsv( this.csvString, {
                    name: {
                        required: true,
                        regex: /^([ \u00c0-\u01ffa-zA-Z\&,\.'\-])+$/,
                    },
                    zip: { required: true, regex: /[0-9]{5}/ },
                    website: {
                        required: this.options.merge,
                        regex: /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-?=%.]+/,
                    },
                } );
                if( !this.csvData.length ) throw new Error( 'No companies match' );
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
   * @param {Object} company
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
   * Picks the next company from the array
   *
   * @param {Object} company
   * @param {boolean} rejectOnFailure
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
                    return rejectOnFailure ? reject( 'Multiple companies match the given data' ) : resolve();
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
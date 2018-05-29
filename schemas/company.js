const Schema = require( 'mongoose' ).Schema;

/**
* Definition for Company Mongo Schema
*
* @return {Mongoose.Schema} Mongoose schema object
*/
module.exports = () => {
    return new Schema( {
        name:  String,
        zip: String,
        website: String,
    } );
};
#!/bin/node

const utils = require( '../services/utils' );
const path = require( 'path' );

( async () => {
    let mongoose;
    let collections;
    try{
        mongoose = await require( '../services/database' );
        collections = await mongoose.db.db.collections();
        for( let collection of collections ) await collection.remove();
        
        await utils.spawn( 'node', [
            'tasks/import_from_file.js',
            `file=${path.join( __dirname, 'initial_data', 'q1_catalog.csv' )}`,
        ] );

        process.exit( 0 );
    }
    catch( ERR ){
        process.exit( 1 );
    }
} )();
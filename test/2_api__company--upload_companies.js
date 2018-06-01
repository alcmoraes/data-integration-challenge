const request = require( 'supertest' );
const path = require( 'path' );

describe( 'POST /companies/upload', () => {
    it( 'Uploads a good CSV without errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, '..', 'tasks', 'initial_data', 'q1_catalog.csv' ) )
                    .expect( 200, { status: 'OK', message: 'CSV added to queue' }, done );
            } );
    } );

    it( 'Uploads a non CSV file trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, 'mock', 'jondoe.png' ) )
                    .expect( 400, { code: 'InvalidContent', message: 'CSV files only' }, done );
            } );
    } );

    it( 'Uploads a CSV with `import` strategy without errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, '..', 'tasks', 'initial_data', 'q1_catalog.csv' ) )
                    .field( 'format', 'import' )
                    .expect( 200, { status: 'OK', message: 'CSV added to queue' }, done );
            } );
    } );

    it( 'Uploads a CSV with a wrong format strategy trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, '..', 'tasks', 'initial_data', 'q1_catalog.csv' ) )
                    .field( 'format', 'wrong-format' )
                    .expect( 500, { 'message':'"value" with value "wrong-format" fails to match the required pattern: /^(merge|import)$/' }, done );
            } );
    } );
} );



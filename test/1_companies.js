const request = require( 'supertest' );
const path = require( 'path' );

describe( 'POST /companies/upload', () => {
    it( 'Uploads a good CSV without errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, '..', 'tasks', 'mock', 'companies.csv' ) )
                    .expect( ( res ) => {
                        res.body = { status: res.body.status };
                    } )
                    .expect( 200, { status: 'OK' }, done );
            } );
    } );

    it( 'Uploads a bad CSV trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/upload' )
                    .attach( 'file', path.join( __dirname, 'mock', 'bad_csv.csv' ) )
                    .expect( 400, { code: 'InvalidContent', message: 'Invalid or empty CSV' }, done );
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
} );



const request = require( 'supertest' );

describe( 'POST /companies', () => {
    it( 'Merge a company that not exists trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies' )
                    .send( {
                        name: 'Fakeblock',
                        zip: '15648',
                        website: 'https://www.fakeblock.com.br',
                        format: 'merge',
                    } )
                    .expect( 500, { message: 'Nothing to merge' }, done );
            } );
    } );

    it( 'Creates a company without errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies' )
                    .send( {
                        name: 'Fakeblock',
                        zip: '15648',
                        format: 'import',
                    } )
                    .expect( 200, { status: 'OK', message: 'Done!' }, done );
            } );
    } );

    it( 'Merges a company with success', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies' )
                    .send( {
                        name: 'Fakeblock',
                        zip: '15648',
                        website: 'https://www.fakeblock.com.br',
                    } )
                    .expect( 200, { status: 'OK', message: 'Done!' }, done );
            } );
    } );
} );



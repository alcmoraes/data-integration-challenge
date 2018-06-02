const request = require( 'supertest' );

describe( 'POST /companies/new', () => {
    it( 'Merge a company that not exists trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/new' )
                    .send( {
                        name: 'Faceblock',
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
                    .post( '/companies/new' )
                    .send( {
                        name: 'Faceblock',
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
                    .post( '/companies/new' )
                    .send( {
                        name: 'Faceblock',
                        zip: '15648',
                        website: 'https://www.fakeblock.com.br',
                    } )
                    .expect( 200, { status: 'OK', message: 'Done!' }, done );
            } );
    } );

    it( 'Creates a company with website data', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/new' )
                    .send( {
                        name: 'Facebook',
                        zip: '15648',
                        format: 'import',
                        website: 'https://www.facebook.com',
                    } )
                    .expect( 200, { status: 'OK', message: 'Done!' }, done );
            } );
    } );

    it( 'Information merged successfully', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/new' )
                    .send( {
                        name: 'Facebook',
                        zip: '15648',
                        format: 'import',
                        website: 'https://www.facebook.com',
                    } )
                    .expect( 200, { status: 'OK', message: 'Done!' }, done );
            } );
    } );

    it( 'Try to merge a company without enough information trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies/new' )
                    .send( {
                        name: 'Face',
                        zip: '15648',
                        website: 'https://www.faceblock.com.br',
                    } )
                    .expect( 500, { message: 'Multiple companies match the given data' }, done );
            } );
    } );
} );



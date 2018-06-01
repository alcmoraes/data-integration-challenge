const request = require( 'supertest' );

describe( 'Server commmons', () => {
    it( 'Requesting as METHOD=OPTIONS should return 204', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .options( '/companies' )
                    .expect( 204, done );
            } );
    } );
} );



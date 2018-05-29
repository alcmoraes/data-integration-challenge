const request = require( 'supertest' );

describe( 'GET /info', () => {
    it( 'Get info', function( done ){
        require( '../server/app' )()
            .then( ( app ) => {
                request( app )
                    .get( '/info' )
                    .set( 'Accept', 'application/json' )
                    .expect( ( res ) => {
                        res.body = { status: res.body.status };
                    } )
                    .expect( 200, {
                        status: 1,
                    }, done );
            } );
    } );
} );



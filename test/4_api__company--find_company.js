const assert = require( 'assert' );
const request = require( 'supertest' );

describe( 'POST /companies', () => {
    it( 'Find a company from database by not giving full name', () => {
        return require( '../server/app' )
            .then( ( app ) => {
                return request( app )
                    .post( '/companies' )
                    .send( {
                        name: 'Bayer',
                        zip: '32736',
                    } )
                    .expect( 200 )
                    .then( ( res ) => {
                        assert( res.body.data[ 0 ].website, 'http://pbs.org/fermentum/donec/ut.xml' );
                    } );
            } );
    } );

    it( 'Lookup for companies without zip or name trigger errors', ( done ) => {
        require( '../server/app' )
            .then( ( app ) => {
                request( app )
                    .post( '/companies' )
                    .send( {
                        zip: 'abcde',
                    } )
                    .expect( 500, { message: 'child "name" fails because ["name" is required]' }, done );
            } );
    } );
} );



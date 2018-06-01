describe( 'Prepare test environment', () => {
    it( 'Clears the database', ( done ) => {
        require( '../services/database' )
            .then( ( mongoose ) => {
                return mongoose.db.db.collections();
            } )
            .then( ( collections ) => {
                return Promise.all( collections.map( ( c ) => c.remove() ) );
            } )
            .then( () => {
                done();
            } );
    } );
} );



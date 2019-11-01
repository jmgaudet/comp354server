const assert = require('assert');
const User = require('../src/models/user');

describe('User', () => {

    let now = new Date();

    const mockUserResults = [
        {
            id: 3,
            firstName: 'Bob',
            lastName: 'Smith',
            primaryAddress: '123 Fake Street',
            email: 'bob_smith@kmail.com',
            created: now
        }
    ];

    it('Should instantiate a User instance from a database row', () => {

        let user = new User(mockUserResults[0]);

        assert.strictEqual(user.id, 3);
        assert.strictEqual(user.firstName, 'Bob');
        assert.strictEqual(user.lastName, 'Smith');
        assert.strictEqual(user.primaryAddress, '123 Fake Street');
        assert.strictEqual(user.email, 'bob_smith@kmail.com');
        assert.strictEqual(user.created, now)

    });


});
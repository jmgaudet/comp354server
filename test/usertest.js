const assert = require('assert');
const User = require('../src/models/user');
// const describe = require('mocha');

describe('User', () => {

    let now = new Date;

    const mockUserResults = [
        {
            id: 3,
            username: 'user123',
            firstName: 'Bob',
            lastName: 'Smith',
            address: '123 Fake Street',
            email: 'bob_smith@kmail.com',
            created: now
        }
    ];

    it ('Should instantiate a User instance from a database row', () => {

        let user = new User(mockUserResults[0]);

        assert.strictEqual(user.id, 3);
        assert.strictEqual(user.username, 'user123');
        assert.strictEqual(user.firstName, 'Bob');
        assert.strictEqual(user.lastName, 'Smith');
        assert.strictEqual(user.address, '123 Fake Street');
        assert.strictEqual(user.email, 'bob_smith@kmail.com');
        assert.strictEqual(user.created, now)

    });




});
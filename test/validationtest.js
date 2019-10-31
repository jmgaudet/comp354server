const assert = require('assert');
const Validation = require('../src/api/validation');

describe('Validation', () => {

    const mockSubmittedUserFields = [{
        body:
            {
                password: 'password123',
                repeat_password: 'password123',
                firstName: 'Bob',
                lastName: 'Smith',
                primaryAddress: '123 Fake Street',
                email: 'bob_smith@kmail.com',
            }
    }];

    it('Should return a valid response from valid user input', (done) => {

        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);

        assert.strictEqual(error, undefined);
        assert.strictEqual(value.password, 'password123');
        assert.strictEqual(value.firstName, 'Bob');
        assert.strictEqual(value.lastName, 'Smith');
        assert.strictEqual(value.primaryAddress, '123 Fake Street');
        assert.strictEqual(value.email, 'bob_smith@kmail.com');
        done();

    });

    it('Should fail if given password field is invalid', (done) => {
        mockSubmittedUserFields[0].body.password = 'short';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"password" with value "short" fails to match the required pattern: /^[a-zA-Z0-9]{8,30}$/`);
        done()
    });

    it('Should fail if \"type password again\" field is mismatched', (done) => {
        mockSubmittedUserFields[0].body.password = 'password123';
        mockSubmittedUserFields[0].body.repeat_password = 'password12';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"repeat_password" must be [ref:password]`);
        done()
    });

    it('Should fail if firstName field is too short', (done) => {   // Same with lastName
        mockSubmittedUserFields[0].body.repeat_password = 'password123';
        mockSubmittedUserFields[0].body.firstName = 'B';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"firstName" length must be at least 2 characters long`);
        done()
    });

    it('Should fail if email field is not an actual email', (done) => {
        mockSubmittedUserFields[0].body.firstName = 'Bob';
        mockSubmittedUserFields[0].body.email = 'bob_smith@kmail.comt';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"email" must be a valid email`);
        done()
    });

});
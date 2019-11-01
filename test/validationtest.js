const assert = require('assert');
const Validation = require('../src/api/validation');

describe('Validation', () => {

    const mockSubmittedUserFields = [{
        body:
            {
                password: 'password12%3',
                repeat_password: 'password12%3',
                firstName: 'bob',
                lastName: 'smith',
                primaryAddress: '123 Fake Street',
                email: 'bob_smith@kmail.com',
            }
    }];

    it('Should return a valid response from valid user input', (done) => {

        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);

        assert.strictEqual(error, undefined);
        assert.strictEqual(value.password, 'password12%3');
        // firstName and lastName get capitalized:
        assert.strictEqual(value.firstName.charAt(0).toUpperCase() + value.firstName.slice(1), 'Bob');
        assert.strictEqual(value.lastName.charAt(0).toUpperCase() + value.lastName.slice(1), 'Smith');
        assert.strictEqual(value.primaryAddress, '123 Fake Street');
        assert.strictEqual(value.email, 'bob_smith@kmail.com');
        done();

    });

    it('Should fail if given password field is invalid', (done) => {
        mockSubmittedUserFields[0].body.password = 'short';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"password" length must be at least 8 characters long`);
        done()
    });

    it('Should fail if \"type password again\" field is mismatched', (done) => {
        mockSubmittedUserFields[0].body.password = 'password123';
        mockSubmittedUserFields[0].body.repeat_password = 'password12';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"repeat_password" must be [ref:password]`);
        done()
    });

    it('Should fail if firstName field is does not define a name', (done) => {   // Same with lastName
        mockSubmittedUserFields[0].body.repeat_password = 'password123';
        mockSubmittedUserFields[0].body.firstName = 'B0b';
        const {error, value} = Validation.checkIfValid(mockSubmittedUserFields[0]);
        assert.strictEqual(error.message, `"firstName" with value "B0b" fails to match the required pattern: /^[A-zÀ-ú\\-]{2,30}$/`);
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
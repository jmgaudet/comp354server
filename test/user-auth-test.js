const assert = require('assert');

const userAuth = require('../src/api/user-authorization');


describe('Authorization Class', ()=> {

    const mockUsers1 =
        {
            id: 1,
            firstName: 'Richard',
            lastName: 'Richardson',
            email: 'richard@richard.com',
            primaryAddress: '123 fake street',
            alternateAddress: '321 fake street',
            password: '123456'
        };





    const mockUsers2 =
        {
            id: 1,
            firstName: 'Richard',
            lastName: 'Richardson',
            email: 'rich@rich.com',
            primaryAddress: '123 fake street',
            alternateAddress: '321 fake street',
            password: '1'
        };



    it('It should return user is authorized', () => {

        var user1 = JSON.stringify(mockUsers1);
        var user2 = JSON.stringify(mockUsers1);

        let expected = '{"is_success":true,"message":"Authorized","contents":[]}';
        let authorized = userAuth(user1,user2);
        assert.strictEqual(authorized, expected);


    });

    it('It should return user is not authorized', () => {

         user1 = JSON.stringify(mockUsers1);
         user2 = JSON.stringify(mockUsers2);

        let expected = '{"is_success":false,"message":"Not Authorized","contents":[]}';
        let authorized = userAuth(user1,user2)
        assert.strictEqual(authorized, expected);

    });

});
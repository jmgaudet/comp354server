const Response = require('./response.js');

module.exports = function UserAuth(userInfo,userDB) {

        var user = JSON.parse(userInfo);
        var userInfoDB = JSON.parse(userDB);



        if (user.email == userInfoDB.email && user.password == userInfoDB.password) {

            return Response.makeResponse(true, 'Authorized');

        } else {
            return Response.makeResponse(false, 'Not Authorized');
        }


};


module.exports = class Response {

    static makeResponse(isSuccess = false, message = '', payload) {
        let response = {};
        response.is_success = isSuccess;
        response.message = message;

        if(Array.isArray(payload)) {
            response.contents = payload;
        } else if(payload != null && typeof payload === 'object') {
            response.contents = [payload];
        } else {
            response.contents = [];
        }

        return JSON.stringify(response);
    }

};
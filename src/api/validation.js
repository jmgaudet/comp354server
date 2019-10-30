const Joi = require('@hapi/joi');

module.exports = class Validation {

    static checkIfValid(req) {

        const schema = Joi.object().keys({
            password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}$/).required(),
            repeat_password: Joi.ref('password'),
            firstName: Joi.string().min(2).required(),
            lastName: Joi.string().min(2).required(),
            primaryAddress: Joi.string().required(),
            alternateAddress: Joi.string(),
            email: Joi.string().email({minDomainSegments: 2, tlds: {allow: ['com', 'net']}})
        });

        return schema.validate(req.body);
    }

};
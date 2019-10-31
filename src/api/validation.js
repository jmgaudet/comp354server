const Joi = require('@hapi/joi');

module.exports = class Validation {

    static checkIfValid(req) {

        const schema = Joi.object().keys({
            password: Joi.string().min(8).required(),
            repeat_password: Joi.ref('password'),
            firstName: Joi.string().pattern(/^[A-zÀ-ú\-]{2,30}$/).required(),
            lastName: Joi.string().pattern(/^[A-zÀ-ú\-]{2,30}$/).required(),
            primaryAddress: Joi.string().required(),
            alternateAddress: Joi.string(),
            email: Joi.string().email({minDomainSegments: 2, tlds: {allow: ['com', 'net']}})
        });

        return schema.validate(req.body);
    }

};
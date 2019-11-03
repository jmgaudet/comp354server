const Response = require('../api/response');
const Rating = require('../models/rating');
const Joi = require('@hapi/joi');

module.exports = class RatingController {
    static getRating(req, res) {
        try {
            let id = req.params.id;
            Rating.getRatingById(id, (err, reviews) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let found = !!reviews;
                let message = found ? 'Received reviews' : 'No reviews yet';

                if (found) {
                    res.send(Response.makeResponse(found, message, reviews));
                }
                else
                    res.send(Response.makeResponse(found, message));
            })
        } catch (e) {

            res.send(Response.makeResponse(false, e.toString()));
        }
    }
}

const Response = require('../api/response');
const Rating = require('../models/rating');
const Joi = require('@hapi/joi');

module.exports = class RatingController {
    static getRating(req, res) {
        try {
            let id = req.params.id;
            Rating.fromId(id, (err, reviews) => {
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

    static addRating(req, res) {
        try {
            const User = require('../models/user.js');
            let rating = new Rating();
   
            // Every item will be bought by the same user, so find the user before the loop:
            User.fromId(req.body.userId, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, `User with id ${req.params.id} does not exist!`));
                    return;
                }
                rating.userId = user.id;

                User.fromId(req.body.sellerId, (err, seller) => {
                    if (err) {
                        res.send(Response.makeResponse(false, `User with id ${req.params.id} does not exist!`));
                        return;
                    }
                    rating.sellerId = seller.id;

                    rating.rate = parseInt(req.body.rate);
                    rating.text = req.body.text;
                    rating.sellerText = req.body.sellerText;

                    rating.save((err, submittedRating) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return
                        }
                        let success = !!submittedRating;
                        let message = success ? 'Rating created' : 'Rating not created';
                        res.send(Response.makeResponse(success,message,submittedRating));
                    });
                });
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    
    static updateRatingBySeller(req, res) {
        try {
            const User = require('../models/user.js');
            let rating = new Rating();
            rating.id = req.params.id;
   
            Rating.fromId(rating.id, (err,foundRating )=> {
                if (err) {
                    res.send(Response.makeResponse(false, `Rating with id ${rating.id} does not exist!`));
                    return;
                }
                rating.text = foundRating.text;
                rating.rate = foundRating.rate;
                User.fromId(req.body.userId, (err, user) => {
                    if (err) {
                        res.send(Response.makeResponse(false, `User with id ${req.body.userId} does not exist!`));
                        return;
                    }
                    rating.userId = user.id;
    
                    User.fromId(req.body.sellerId, (err, seller) => {
                        if (err) {
                            res.send(Response.makeResponse(false, `User with id ${req.body.sellerId} does not exist!`));
                            return;
                        }
                        rating.sellerId = seller.id;
    
                        rating.sellerText = req.body.sellerText;
    
                        rating.save((err, submittedRating) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return
                            }
                            let success = !!submittedRating;
                            let message = success ? 'Rating updated by Seller' : 'Rating not updated by seller';
                            res.send(Response.makeResponse(success,message,submittedRating));
                        }, true);
                    });
                });
    
            });
            // Every item will be bought by the same user, so find the user before the loop:
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

        
    static updateRatingByBuyer(req, res) {
        try {
            const User = require('../models/user.js');
            let rating = new Rating();
            rating.id = req.params.id;
   
            Rating.fromId(rating.id, (err,foundRating )=> {
                if (err) {
                    res.send(Response.makeResponse(false, `Rating with id ${rating.id} does not exist!`));
                    return;
                }
                rating.sellerText = foundRating.sellerText;
                User.fromId(req.body.userId, (err, user) => {
                    if (err) {
                        res.send(Response.makeResponse(false, `User with id ${req.body.userId} does not exist!`));
                        return;
                    }
                    rating.userId = user.id;
    
                    User.fromId(req.body.sellerId, (err, seller) => {
                        if (err) {
                            res.send(Response.makeResponse(false, `User with id ${req.body.sellerId} does not exist!`));
                            return;
                        }
                        rating.sellerId = seller.id;
    
                        rating.rate = req.body.rate;
                        rating.text = req.body.text;

                        rating.save((err, submittedRating) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return
                            }
                            let success = !!submittedRating;
                            let message = success ? 'Rating updated by buyer' : 'Rating not updated by buyer';
                            res.send(Response.makeResponse(success,message,submittedRating));
                        }, true);
                    });
                });
    
            });
            // Every item will be bought by the same user, so find the user before the loop:
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }
}

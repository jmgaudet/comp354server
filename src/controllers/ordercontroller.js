const moment = require('moment');

const Order = require('../models/order');
const Response = require('../api/response');
const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');
const async = require('async');
const User = require('../models/user.js');
const Product = require('../models/product.js');

module.exports = class OrderController {

    static getAllOrdersSorted(req, res) {
        try {
            let page = req.query.page && req.query.page > 0 ? parseInt(req.query.page) : 1;
            let max = req.query.max && req.query.max > 0 ? parseInt(req.query.max) : 10;
            let sort = req.query.sort && req.query.sort !== '' ? req.query.sort : 'created';
            let asc = req.query.asc && req.query.asc === 'true';

            Order.getAllSorted((err, orders, pages) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                } else {
                    res.send(Response.makeResponse(true, `Got all orders page ${page}`, orders, pages));
                }
            }, page, max, sort, asc);
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getUserSales(req, res) {
        try {
            let userId = req.params.id;
            Order.getSalesByUser(userId, (err, orders) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                res.send(Response.makeResponse(true, "Got user sales", orders));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static createOrder(req, res) {
        try {
            const ShoppingCart = require('../models/shoppingcart');
            const Product = require('../models/product.js');
            const User = require('../models/user.js');
            const order = new Order;
            let jsonOrderSummary = [];

            // let orderTime = order.created
            // let timeOrder = new Date(orderTime);
            // let d = new Date(orderTime);
            // d = (d.getTimezoneOffset() * 60000);
            // timeOrder = timeOrder - d;
            // var time = new Date(timeOrder)
            // time = time.toISOString();
            // time =time.slice(0, 19).replace('T', ' ');


            order.shippingAddress = req.body.shippingAddress;

            // Every item will be bought by the same user, so find the user before the loop:
            User.fromId(req.params.id, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, `User with id ${req.params.id} does not exist!`));
                    return;
                }
                order.buyerId = user.id;
                let name = user.firstName
                let lastname = user.lastName
                let email = user.email

                ShoppingCart.getCartItems(order.buyerId, (err, items) => {
                    if (err || items.length === 0) {
                        res.send(Response.makeResponse(false, `Could not get cart items`));
                        return;
                    }

                    items.forEach((item, index, array) => {

                        // Find the product:
                        Product.fromId(item.productId, (err, prod) => {

                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            // Have to recheck that the item did not run out of stock while it was sitting in the user's cart
                            if (prod.quantity < item.quantity) {
                                // let message = `Check product "quantity": The quantity you are trying to order
                                //     (${item.quantity}) is greater than the product stock (${prod.quantity})`;
                                // res.send(Response.makeResponse(false, message, prod));
                                return;
                            }

                            order.sellerId = prod.sellerId;
                            order.productId = prod.id;
                            order.quantity = item.quantity;
                            order.totalCost = item.quantity * prod.price;
                            order.delivered = 0;

                            order.save((err, submittedOrder) => {

                                if (err) {
                                    res.send(Response.makeResponse(false, `Error: could not place order`));
                                    return;
                                }
                                jsonOrderSummary.push(submittedOrder.toJson());

                                item.delete((err, removedItem) => {
                                    if (err) {
                                        res.send(Response.makeResponse(false, err.toString()));
                                        return;
                                    }

                                    prod.quantity = prod.quantity - order.quantity;
                                    prod.save((err, updatedProduct) => {
                                        if (err) {
                                            res.send(Response.makeResponse(false, `Error: product quantity could not be updated`));
                                            return;
                                        }

                                        if (index === array.length - 1) {
                                            // console.log('The last iteration!');

                                            // console.log(time);
                                            this.emailOrder(jsonOrderSummary,name,lastname,email,res)

                                            // res.send(Response.makeResponse(true, "Order placed", jsonOrderSummary));
                                        }
                                    }, true);
                                });
                            });
                        });
                    });
                });
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getUserOrders(req, res) {
        try {
            let userId = req.params.id;
            Order.getOrderByUser(userId, (err, orders) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                res.send(Response.makeResponse(true, "Got user orders", orders));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


        //function to prepare data for the purchase confirm email
    static emailOrder(jsonOrderSummary,firstName,LastName,email,res){

                    const Product = require('../models/product.js');
                    //get complete order

                    let totalPrice = 0;
                    let orderSum ='';
                    let sellerIDs = [];
                    let orderIDs =[];
                    jsonOrderSummary.forEach((item,index,array) => {
                        let  id = item.productId;
                        let cost = 0;
                        let name  ='';
                        let amount = '';
                        Product.fromId(id, (err, prod) => {
                            if(err)  {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            sellerIDs.push(item.sellerId);
                            orderIDs.push(item.id);
                            amount = item.quantity
                            name = prod.name
                            cost = prod.price
                            orderSum = orderSum  +"<br></br>" + '<b>Product Name:</b> ' + name + ', <b>Quantity:</b> ' +  amount + ', <b>Price: $</b>' + cost ;
                            totalPrice = totalPrice + parseInt(cost);
                            if (index === jsonOrderSummary.length - 1){

                                this.sellerEmail(sellerIDs,res,jsonOrderSummary,firstName,LastName,orderSum,totalPrice,orderIDs);
                                // this.sendBuyerEmail(firstName,LastName,orderSum,totalPrice,jsonOrderSummary,email,sellerIDs,time,res);


                            }

                        });

                    });






                }



        //this function creates the email that is sent when a user completes a purchase
    static sendBuyerEmail(firstName, LastName, orderSum, totalPrice, jsonOrderSummary, email,sellerIDs,time,res) {
        let sellers = sellerIDs
        let timeCreated = time
        const transporter = nodemailer.createTransport(sparkPostTransport({
            sparkPostApiKey: process.env.SPARKPOST_API_KEY
        }));
        let PurchaseEmail = {
            from: 'no-reply@allanpichardo.com',
            to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
            //to: email,               //TODO: once users have actual associated emails, we could use this
            subject: 'Thank You For Your Purchase',
            html: 'Hi ' + firstName +' '+ LastName +','+
                '<br></br><br></br>Thank You For Your Purchase, Your Order Has Been Placed.<br></br>' +
                orderSum +'<br></br><br></br>'  +'<b>Total Price: $</b>' + totalPrice+ '<br></br><br></br>'
                + 'Thank You For Your Business <br></br><br></br>' +
                'Best, 354TheStars Team'
        };
        //Send created email to user via nodemailer's transporter

        transporter.sendMail(PurchaseEmail, function (err, info) {
            if (err) {
                // res.send(Response.makeResponse(false, err.toString()));
            }

        });




    }



    static sellerEmail(sellerIDs,res,jsonOrderSummary,firstName,LastName,orderSum,totalPrice,orderIDs) {


        const transporter = nodemailer.createTransport(sparkPostTransport({
            sparkPostApiKey: process.env.SPARKPOST_API_KEY
        }));
      ;
        function onlyUnique(value, index, self) {return self.indexOf(value) === index;}
        var sellers = sellerIDs.filter(onlyUnique);
        let timeCreated = ''
        console.log(sellers)

        let quantities = []
        let productIDS =[]
        let sellerInfo
        let orders = orderIDs[0];
        console.log(orders);

        async.waterfall([
            function getTime(callback){

            Order.getOrderByOrderID(orders,(err,timeFromOrder)=>{
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                }
                console.log("gettime function")
                console.log(timeFromOrder[0].created);


                let orderTime = timeFromOrder[0].created;
                let timeOrder = new Date(orderTime);
                let d = new Date(orderTime);
                d = (d.getTimezoneOffset() * 60000);
                timeOrder = timeOrder - d;
                let time = new Date(timeOrder);
                timeCreated = time.toISOString();
                timeCreated =timeCreated.slice(0, 19).replace('T', ' ');
                console.log(timeCreated);


                callback(null,timeFromOrder);
                });

            },


           function  getOrder (arg1,callback) {
                    Order.getOrderByIDByTime(sellers, timeCreated, (err, order) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                        }
                       order.forEach((item, index) => {
                            productIDS.push(item.productId);
                            quantities.push(item.quantity);
                        });
                        console.log(productIDS);
                        console.log(order);
                        callback(null, order);

                    });

                },
            function getUsers(arg2,callback) {
            console.log("getting users");
            console.log(productIDS);

                Order.getUsersFromOrder(productIDS,(err,user) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                        }

                        console.log(user)
                        console.log("should be users here");
                        sellerInfo = user;
                        callback(null,user);
                    });

            },

            function sendEmails (arg2,callback) {

                sellerInfo.forEach((item, index) => {

                    let PurchaseEmail = {
                        from: 'no-reply@allanpichardo.com',
                        to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
                        //to: email,               //TODO: once users have actual associated emails, we could use this
                        subject: 'Congratulations You Sold Something!!',
                        html: 'Hi ' + item.firstName + ' ' + item.lastName + ',' +
                            '<br></br><br></br>Congratulations!!! You Sold These Item(s).<br></br><br></br>' + '<b>Product Name: </b>'+
                        item.name + '<br></br><br></br>' + '<b>Total Price: $</b>' + item.price + '<br></br><br></br>'
                            + 'Thank You For Your Business <br></br><br></br>' +
                            'Best, 354TheStars Team'
                    };

                    transporter.sendMail(PurchaseEmail, function (err, info) {

                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                        }

                    });

                    if(index === sellerInfo - 1) {
                        let PurchaseEmail = {
                            from: 'no-reply@allanpichardo.com',
                            to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
                            //to: email,               //TODO: once users have actual associated emails, we could use this
                            subject: 'Congratulations You Sold Something!!',
                            html: 'Hi ' + item.firstName + ' ' + item.lastName + ',' +
                                '<br></br><br></br>Congratulations!!! You Sold These Item(s).<br></br><br></br>' +
                                '<b>Product Name: </b>' + item.name + '<br></br><br></br>' + '<b>Total Price: $</b>' + item.price + '<br></br><br></br>'
                                + 'Thank You For Your Business <br></br><br></br>' +
                                'Best, 354TheStars Team'
                        };

                        transporter.sendMail(PurchaseEmail, function (err, info) {

                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                            }

                            callback(info);


                        });

                    }

                });


                }

    ],
            function (err, result) {

                // res.send(Response.makeResponse(true, 'buyer and seller emails sent, buyer summary',jsonOrderSummary));
        });

        const transporter2 = nodemailer.createTransport(sparkPostTransport({
            sparkPostApiKey: process.env.SPARKPOST_API_KEY
        }));
        console.log("234324234342342342343243243243243243");

        let PurchaseEmail2 = {
            from: 'no-reply@allanpichardo.com',
            to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
            //to: email,               //TODO: once users have actual associated emails, we could use this
            subject: 'Thank You For Your Purchase',
            html: 'Hi ' + firstName +' '+ LastName +','+
                '<br></br><br></br>Thank You For Your Purchase, Your Order Has Been Placed.<br></br>' +
                orderSum +'<br></br><br></br>'  +'<b>Total Price: $</b>' + totalPrice+ '<br></br><br></br>'
                + 'Thank You For Your Business <br></br><br></br>' +
                'Best, 354TheStars Team'
        };

        //Send created email to user via nodemailer's transporter

        transporter2.sendMail(PurchaseEmail2, function (err, info) {
            if (err) {
                res.send(Response.makeResponse(false, err.toString()));
            }

        });

        res.send(Response.makeResponse(true, 'buyer and seller emails sent, buyer summary',jsonOrderSummary));
    }


};



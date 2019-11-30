const Order = require('../models/order');
const Response = require('../api/response');
const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');

module.exports = class OrderController {


    static createOrder(req, res) {
        try {
            const ShoppingCart = require('../models/shoppingcart');
            const Product = require('../models/product.js');
            const User = require('../models/user.js');
            const order = new Order;
            let jsonOrderSummary = [];


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
                                let message = `Check product "quantity": The quantity you are trying to order 
                                    (${item.quantity}) is greater than the product stock (${prod.quantity})`;
                                res.send(Response.makeResponse(false, message, prod));
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
                                            let timeCreated = order.created
                                            this.emailOrder(jsonOrderSummary,name,lastname,email,timeCreated,res)
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
                let success = !!orders[0];  // orders is always an array -- have to be more specific
                let message = success ? `Got user's orders with user id ${userId}` : `Could not get user's orders`;
                res.send(Response.makeResponse(success, message, orders));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


        //function to prepare data for the purchase confirm email
    static emailOrder(jsonOrderSummary,firstName,LastName,email,time,res){

        const Product = require('../models/product.js');
        //get complete order
        let timeCreated = time
        let totalPrice = 0;
        let orderSum ='';
        let sellerIDs = [];
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
                    amount = item.quantity
                    name = prod.name
                    cost = prod.price
                    orderSum = orderSum  +"<br></br>" + '<b>Product Name:</b> ' + name + ', <b>Quantity:</b> ' +  amount + ', <b>Price: $</b>' + cost ;
                    totalPrice = totalPrice + parseInt(cost);
                    if (index === jsonOrderSummary.length - 1){

                        this.sendBuyerEmail(firstName,LastName,orderSum,totalPrice,jsonOrderSummary,email,sellerIDs,timeCreated,res);

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
        this.sellerEmail(sellers, timeCreated,res,jsonOrderSummary);

    }



    static sellerEmail(sellerIDs, time,res,jsonOrderSummary) {
        const User = require('../models/user.js');
        const Product = require('../models/product.js');
        let timeCreated = (new Date ((new Date((new Date(new Date())).toISOString() )).getTime() - ((new Date()).getTimezoneOffset()*60000))).toISOString().slice(0, 19).replace('T', ' ');
        let firstName ;
        let lastName;
        let email;


        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
       var sellers = sellerIDs.filter(onlyUnique);

        sellers.forEach((seller,index,array) => {
            let  id = seller;
            let totalPrice = 0;
            let orderSum ='';


                Order.getOrderByIDByTime(id,timeCreated, (err, order) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    {
                        order.forEach((item,i,array) => {
                            let  productID = item.productId;
                            let cost = 0;
                            let name  ='';
                            let amount = '';


                            Product.fromId(productID, (err, prod) => {
                                if(err) {
                                    res.send(Response.makeResponse(false, err.toString()));
                                    return;
                                }
                                amount = item.quantity;
                                name = prod.name;
                                cost = prod.price;
                                orderSum = orderSum  +"<br></br>" + '<b>Product Name:</b> ' + name + ', <b>Quantity:</b> ' +  amount + ', <b>Price: $</b>' + cost ;
                                totalPrice = totalPrice + parseInt(cost);


                                    User.fromId(id, (err, foundUser) => {
                                        if (err) {
                                            res.send(Response.makeResponse(false, err.toString()));
                                            return;
                                        }
                                        firstName = foundUser.firstName
                                        lastName = foundUser.lastName
                                        email = foundUser.email

                                        this.sendSellerEmail(firstName, lastName, email, orderSum, totalPrice, res)



                                    });

                            });
                        });
                    }
            });

                if(index === sellerIDs.length -1 ) {
                    res.send(Response.makeResponse(true, "Buyer and Seller Emails sent, here is buyer summary",jsonOrderSummary))

                }

        });



    }

    static sendSellerEmail(firstName,LastName,email,orderSum,totalPrice,res) {

        console.log(firstName,LastName,email,orderSum)


            const transporter = nodemailer.createTransport(sparkPostTransport({
                sparkPostApiKey: process.env.SPARKPOST_API_KEY
            }));
            let PurchaseEmail = {
                from: 'no-reply@allanpichardo.com',
                to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
                //to: email,               //TODO: once users have actual associated emails, we could use this
                subject: 'Congratulations You Sold Something!!',
                html: 'Hi ' + firstName + ' ' + LastName + ',' +
                    '<br></br><br></br>Congratulations!!! You Sold These Item(s).<br></br>' +
                    orderSum + '<br></br><br></br>' + '<b>Total Price: $</b>' + totalPrice + '<br></br><br></br>'
                    + 'Thank You For Your Business <br></br><br></br>' +
                    'Best, 354TheStars Team'
            };


            //Send created email to user via nodemailer's transporter

            transporter.sendMail(PurchaseEmail, function (err, info) {

                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                }

            });




    }


};
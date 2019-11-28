const Order = require('../models/order');
const Response = require('../api/response');
const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');

module.exports = class OrderController {

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
                                            this.emailOrder(res,jsonOrderSummary,name,lastname,email)
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
    static emailOrder(res,jsonOrderSummary,firstName,LastName,email){

        const Product = require('../models/product.js');
        //get complete order

        let totalPrice = 0;
        let orderSum ='';
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
                         amount = item.quantity
                         name = prod.name
                         cost = prod.price
                        orderSum = orderSum  +"<br></br>" + '<b>Product Name:</b> ' + name + ', <b>Quantity:</b> ' +  amount + ', <b>Price: $</b>' + cost ;
                        totalPrice = totalPrice + parseInt(cost);
                if (index === jsonOrderSummary.length - 1){

                    this.sendEmail(firstName,LastName,orderSum,totalPrice,jsonOrderSummary,email,res);
                }

                    });

        });



    }

        //this function creates the email that is sent when a user completes a purchase
    static sendEmail(firstName,LastName,orderSum,totalPrice,jsonOrderSummary,email,res) {
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
                res.send(Response.makeResponse(false, err.toString()));
            } else {
                res.send(Response.makeResponse(true, 'User Purchase email was successfully sent',jsonOrderSummary));
            }
        });

    }

};
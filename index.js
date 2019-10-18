require('dotenv').config();
const path = require('path');
const express = require('express');
const multer  = require('multer');
const app = express();
const Response = require('./src/api/response.js');
const ProductController = require('./src/controllers/productcontroller.js');

const publicDirectory = path.join(__dirname, 'public');
const productImageUploads = multer({storage: getProductImageStorage()});
const profileImageUploads = multer({storage: getProfileImageStorage()});

const port = process.env.PORT || 3030;
app.use(express.static(publicDirectory));

/*================== Add your routes here =====================*/

app.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * Return all products
 */
app.get('/products', (req, res) => {
    let page = req.query.page ? req.query.page : 1;
    let max = req.query.max ? req.query.max : 10;

    ProductController.getAllProducts((err, products) => {
        if(err) {
            res.send(Response.makeResponse(false, err.toString()));
        } else {
            res.send(Response.makeResponse(true, `Got page ${page}`, products));
        }
    }, page, max);
});

/*================== End Routes =====================*/

/* -----------------Config Stuff------------------- */
app.listen(port, () => console.log(`Server listening on port ${port}!`));

function getProductImageStorage() {
    return multer.diskStorage({
        destination: path.join(publicDirectory, 'products'),
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
                cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
            });
        }
    });
}

function getProfileImageStorage() {
    return multer.diskStorage({
        destination: path.join(publicDirectory, 'profiles'),
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
                cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
            });
        }
    });
}
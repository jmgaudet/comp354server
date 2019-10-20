require('dotenv').config();
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const express = require('express');
const multer  = require('multer');
const app = express();
const mime = require('mime');
const Response = require('./src/api/response');
const ProductController = require('./src/controllers/productcontroller');

const publicDirectory = path.join(__dirname, 'public');
const productImageUploads = multer({storage: getProductImageStorage()});
const profileImageUploads = multer({storage: getProfileImageStorage()});

const port = process.env.PORT || 3030;
app.use(express.static(publicDirectory));

app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    next();
});

/*================== Add your routes here =====================*/

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/categories/', (req, res) => {
    ProductController.getAllCategories(req, res);
});

app.get('/categories/:id/', (req, res) => {
    ProductController.getCategory(req, res);
});

app.get('/manufacturers/', (req, res) => {
    ProductController.getAllManufacturers(req, res);
});

app.get('/manufacturers/:id/', (req, res) => {
    ProductController.getManufacturer(req, res);
});

app.get('/products/', (req, res) => {
    ProductController.getAllProducts(req, res);
});

app.get('/products/:id/', (req, res) => {
    ProductController.getProduct(req, res);
});

app.delete('/products/:id/', (req, res) => {
    ProductController.deleteProduct(req, res);
});

app.post('/products/', productImageUploads.any(), (req, res) => {
    let imageUrls = [];
    req.files.forEach((file) => {
        imageUrls.push(getProductImageUrl(getBaseUrl(req), file.filename));
    });
    ProductController.addNewProduct(req, res, imageUrls);
});


/*================== End Routes =====================*/

/* -----------------Config Stuff------------------- */
app.listen(port, () => console.log(`Server listening on port ${port}!`));

function getProductImageStorage() {
    return multer.diskStorage({
        destination: path.join(publicDirectory, 'products'),
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
                cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
            });
        }
    });
}

function getProfileImageStorage() {
    return multer.diskStorage({
        destination: path.join(publicDirectory, 'profiles'),
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
                cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
            });
        }
    });
}

function getBaseUrl(req) {
    return req.protocol + '://' + req.get('host');
}

function getProfileImageUrl(baseUrl, filename) {
    return url.resolve(baseUrl, `/profiles/${filename}`);
}

function getProductImageUrl(baseUrl, filename) {
    return url.resolve(baseUrl, `/products/${filename}`);
}
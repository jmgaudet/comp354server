require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const app = express();
const mime = require('mime');
const Response = require('./src/api/response');
const ProductController = require('./src/controllers/productcontroller');
const UserController = require('./src/controllers/usercontroller');
const CartController = require('./src/controllers/cartcontroller');
const RatingController = require('./src/controllers/ratingcontroller');
const OrderController = require('./src/controllers/ordercontroller');
app.use(express.json());
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

/*~~~~~~~~~~~~ Product routes ~~~~~~~~~~~~*/

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

app.get('/products/featured', (req, res) => {
    ProductController.getFeaturedProducts(req, res);
});

app.get('/products/:id/', (req, res) => {
    ProductController.getProduct(req, res);
});

app.delete('/products/:id/', (req, res) => {
    ProductController.deleteProduct(req, res);
});


app.post('/products/', productImageUploads.any(), (req, res) => {

    (async () => {
        let imageUrls = [];
        for (let i = 0; i < req.files.length; i++) {
            let url = await getProductImageUrl(req.files[i].filename, req.files[i].mimetype);
            imageUrls.push(url);
        }
        ProductController.addNewProduct(req, res, imageUrls);
    })();
});

app.get('/users/:userId/products', (req, res) => {
    ProductController.getAllForUser(req, res);
});

app.put('/products/:id/details', productImageUploads.none(), (req, res) => {
    ProductController.updateProductDetails(req, res);
});

app.get('/admin/stats', (req, res) => {
    UserController.getAdminStats(req, res);
});

app.get('/orders', (req, res) => {
    OrderController.getAllOrdersSorted(req, res);
});

/*~~~~~~~~~~~~ User routes ~~~~~~~~~~~~*/

app.get('/users/:id/stats', (req, res) => {
    UserController.getSellerStats(req, res);
});

app.get('/users', (req, res) => {
    UserController.getAllUsers(req, res);
});

app.get('/users/:id', (req, res) => {
    UserController.getUser(req, res);
});

app.delete('/users/:id', (req, res) => {
    UserController.deleteUser(req, res);
});

// Update: profile picture
app.put('/users/:id/profileImage', profileImageUploads.any(), (req, res) => {
    (async () => {
        let profilePicUrl = await getProfileImageUrl(req.files[0].filename, req.files[0].mimetype);
        UserController.updateUserProfileImage(req, res, profilePicUrl);
    })()

});

// Update: firstName, lastName, primaryAddress, alternateAddress
app.put('/users/:id/details', (req, res) => {
// app.put('/users/update/details/:id', (req, res) => {
    UserController.updateUserDetails(req, res);
});

// Update: password
app.put('/users/:id/password', (req, res) => {
    UserController.updateUserPassword(req, res,);
});

app.post('/users', profileImageUploads.any(), (req, res) => {
    (async () => {
        let profilePicUrl = await getProfileImageUrl(req.files[0].filename, req.files[0].mimetype);     // Only taking the first file
        UserController.addNewUser(req, res, profilePicUrl);
    })();
});

//check if user is authorized
app.post('/login/', profileImageUploads.none(), (req, res) => {
    UserController.userAuth(req, res);
});

//send welcome email after sign up
app.post('/welcome/', profileImageUploads.none(), (req, res) => {
    UserController.signUpEmail(req, res);
});

app.post('/passwordreset/', profileImageUploads.none(), (req, res) => {
    UserController.passReset(req, res);
});

app.get('/users/:id/ratings', (req, res) => {
    UserController.getRating(req, res);
});

app.get('/ratings/:id/', (req, res) => {
    RatingController.getRating(req, res);
});

app.get('/seller/:id/ratings', (req, res) => {
    UserController.getRatingBySeller(req, res);
});

app.post('/ratings', (req, res) => {
    RatingController.addRating(req, res);
});

app.put('/ratings/:id/', (req, res) => {
    RatingController.updateRatingBySeller(req, res);
});


app.put('/ratings/user/:id/', (req, res) => {
    RatingController.updateRatingByBuyer(req, res);
});

app.delete('/ratings/:id/', (req, res) => {
    RatingController.deleteRating(req, res);
});
/*~~~~~~~~~~~~ Cart routes ~~~~~~~~~~~~*/

app.get('/users/:id/cart', (req, res) => {
    CartController.getUserCart(req, res);
});

app.delete('/users/:id/cart', (req, res) => {
    CartController.deleteFromCart(req, res);
});

app.post('/users/:id/cart', (req, res) => {
    CartController.addToCart(req, res);
});

app.put('/cart/:id', (req, res) => {
    CartController.updateQuantity(req, res);
});


/*~~~~~~~~~~~~ Order routes ~~~~~~~~~~~~*/

app.get('/users/:id/orders', (req, res) => {
    OrderController.getUserOrders(req, res);
});

app.get('/users/:id/sales', (req, res) => {
    OrderController.getUserSales(req, res);
});

app.post('/users/:id/orders', (req, res) => {
    OrderController.createOrder(req, res);
});

/*================== End Routes =====================*/

/* -----------------Config Stuff------------------- */
app.listen(port, () => console.log(`Server listening on port ${port}!`));

function getProductImageStorage() {
    return multer.diskStorage({
        destination: path.join(publicDirectory, 'product_images'),
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

function getProfileImageUrl(filename, mimeType) {
    let p = path.join(publicDirectory, 'profiles', filename);
    return uploadToAWS(p, `profiles/${filename}`, mimeType);
}

function getProductImageUrl(filename, mimeType) {
    let p = path.join(publicDirectory, 'product_images', filename);
    return uploadToAWS(p, `products/${filename}`, mimeType);
}

async function uploadToAWS(fileName, key, mimeType) {
    const s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    });

    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'comp354-allan',
        Key: key, // File name you want to save as in S3
        Body: fileContent,
        ACL: 'public-read',
        ContentType: mimeType
    };

    // Uploading files to the bucket
    const data = await s3.upload(params).promise().catch(e => {
        console.log(e)
    });
    let url = data.Location;
    return url;
};
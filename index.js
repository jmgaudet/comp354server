require('dotenv').config();
const path = require('path');
const express = require('express');
const multer  = require('multer');
const app = express();

const publicDirectory = path.join(__dirname, 'public');
const productImageUploads = multer({ dest: path.join(publicDirectory, 'products')});
const profileImageUploads = multer({dest: path.join(publicDirectory, 'profiles')});

const port = process.env.PORT || 3030;
app.use(express.static(publicDirectory));

/* Add your routes here */
app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(port, () => console.log(`Server listening on port ${port}!`));
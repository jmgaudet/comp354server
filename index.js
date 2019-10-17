require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3030;

/* Serve any static files in the public directory */
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));

/* Add your routes here */
app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(port, () => console.log(`Server listening on port ${port}!`));
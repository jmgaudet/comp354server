const Model = require('./model.js');
const Category = require('./category.js');
const Manufacturer = require('./manufacturer.js');
const ProductImage = require('./productimage.js');

module.exports = class Product extends Model{

    constructor(dbRow){
        super(dbRow);
    }

    static getTable() {
        return 'Products';
    }

    getImages(callback, dryRun = false) {
        let params = [ProductImage.getTable(), this.id];
        let query = 'select * from ?? where productId = ?';

        if(!dryRun) this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                let r = [];
                results.forEach((row) => {
                    r.push(new ProductImage(row));
                });
                callback(null, r);
            }
        });

        return this.db.format(query, params);
    }

    getManufacturer(callback, dryRun = false) {
        let params = [Manufacturer.getTable(), this.manufacturerId];
        let query = 'select * from ?? where id = ?';

        if(!dryRun) this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                callback(null, new Manufacturer(results[0]));
            }
        });

        return this.db.format(query, params);
    }

    getCategories(callback, dryRun = false) {
        let params = [Category.getTable(), "ProductsCategories", this.id];
        let query = 'select * from ?? c where c.id in (select categoryId from ?? where productId = ?)';

        if(!dryRun) this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                let r = [];
                results.forEach((row) => {
                    r.push(new Category(row));
                });
                callback(null, r);
            }
        });

        return this.db.format(query, params);
    }

    getCompleteObject(callback) {
        let _this = this;
        let json = this.toJson();
        this.getCategories((err, categories) => {
            if(err) {
                callback(err);
            }
            json.categories = [];
            categories.forEach((category) => {
                json.categories.push(category.toJson());
            });
            _this.getManufacturer((err, manufacturer) => {
                if(err) {
                    callback(err);
                }
                json.manufacturer = manufacturer.toJson();
                _this.getImages((err, images) => {
                    if(err) {
                        callback(err);
                    }
                    json.images = [];
                    images.forEach((image) => {
                        json.images.push(image.toJson());
                    });

                    callback(null, json);
                });
            })
        });
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            quantity: this.quantity,
            sellerId: this.sellerId,
            manufacturerId: this.manufacturerId,
            description: this.description,
            created: this.created,
        }
    }
};
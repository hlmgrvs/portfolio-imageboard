var spicedPg = require('spiced-pg');
const {dbUser, dbPass} = require('./secrets');
let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/imageboard`);
}

module.exports.getImages = function() {
    return db.query(
        `SELECT *
        FROM images
        ORDER BY id DESC
        LIMIT 8
        `
    );
};

module.exports.getLowestId = function() {
    return db.query(
        `SELECT id AS lowest_id
        FROM images
        ORDER BY id DESC
        LIMIT 1`
    );
};

module.exports.getMoreImages = function(lowest_id) {
    return db.query(
        `SELECT *
        FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 4`,
        [lowest_id]
    );
};

module.exports.addImage = function(url, username, title, description) {
    return db.query(
        `INSERT INTO images (url, username, title, description)
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [url, username, title, description]
    );
};

module.exports.getImageData = function(imageId) {
    return db.query(
        `SELECT *
        FROM images
        WHERE id = $1`,
        [imageId]
    );
};

module.exports.addComment = function(username, comment, imageId) {
    return db.query(
        `INSERT INTO comments (username, comment, imageId)
        VALUES ($1, $2, $3) RETURNING *`,
        [username, comment, imageId]
    );
};

module.exports.getImgComments = function(imageId) {
    return db.query(
        `SELECT *
        FROM comments
        WHERE imageId = $1
        ORDER BY id DESC`,
        [imageId]
    );
};

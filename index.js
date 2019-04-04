const express = require('express');
const db = require('./db');
const app = express();
const multer = require('multer');
const uidSafe = require('uid-safe');
const path = require('path');
const s3 = require('./s3');
const config = require('./config');
const bodyParser = require('body-parser');


app.use(express.static('./public'));

app.use(bodyParser.json());

var diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});

app.post('/upload', uploader.single('file'), s3.upload, function(req, res) {
    // console.log('post upload');
    // console.log('req.body + file: ', req.body, req.file);
    // console.log("config.s3Url + req.file.filename: ", config.s3Url + req.file.filename);
    db.addImage(
        config.s3Url + req.file.filename,
        req.body.name,
        req.body.title,
        req.body.description
    ).then(
        ({rows}) => {
            res.json(rows[0]);
        }
    );
});

app.get('/images', (req, res) => {
    db.getImages().then(dbResult => {
        // console.log("dbResult: ", dbResult);
        res.json(dbResult.rows);
    }).catch(err => {
        console.log("error in get/images: ", err);
    });
});

// app.get('/modal', (req, res) => {
//     db.getImgComments().then(dbData => {
//         console.log('dbData', dbData);
//         res.json(dbData.rows);
//     }).catch(err => {
//         console.log("error in post/modal: ", err);
//     });
// });
//
// app.post('/modal', (req, res) => {
//     db.addComments().then(dbData => {
//         console.log('dbData', dbData);
//         res.json(dbData.rows);
//     }).catch(err => {
//         console.log("error in get/modal: ", err);
//     });
// });

app.get('/image/:id/data', (req, res) => {
    db.getImageData(req.params.id).then((dbInfo) => {
        // console.log(dbInfo.rows);

        res.json(dbInfo.rows);
    }).catch(err => {
        console.log("error in /image/:id/data: ", err);
    });
});

app.get('/image/:id/comments', (req, res) => {
    if (req.params.id) {
        db.getImgComments(req.params.id).then((dbInfo) => {
            res.json(dbInfo.rows);
        }).catch(err => {
            console.log("error in /image/:id/comments ", err);
        });
    }
});

app.post('/comment/:id/add', (req, res) => {
    db.addComment(req.body.name, req.body.text, req.params.id).then((dbInfo) => {
        console.log("dbInfo.rows: ", dbInfo.rows);
        res.json(dbInfo.rows);
    }).catch(err => {
        console.log("error in /comment/:id/add ", err);
    });
});

// app.get('image/:id/more', (req, res) => {
//     db.getMoreImages(req.params.id).then((dbInfo) => {
//         res.json(dbInfo.rows);
//     }).catch(err => {
//         console.log("error in GET /more ", err);
//     });
// });

app.get('/images/:id/more', (req, res) => {
    Promise.all([
        db.getMoreImages(req.params.id),
        db.getLowestId()
    ]).then(dbInfo => {
        res.json(dbInfo);
    });
});



app.listen(8080, () => console.log('Listening!'));
// unshift to move the stuff in the beginning of the array , pass to front

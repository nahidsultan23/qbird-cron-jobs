const aws = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;

const s3config = require('../config/s3Config');
const s3 = new aws.S3({
    accessKeyId: s3config.accessKeyId,
    secretAccessKey: s3config.secretAccessKey,
    region: s3config.region
});

const dbConfig = require('../config/db-config');

var dbOptions =  {
    autoBackupPath: path.join(__dirname,'/')
};

const prepareFolderName = (date) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if(month < 10) {
        month = '0' + month;
    }

    if(day < 10) {
        day = '0' + day;
    }

    return 'mongodump-' + year + '-' + month + '-' + day;
}

const prepareBackupPath = (date) => {
    return dbOptions.autoBackupPath + prepareFolderName(date);
}

function uploadDir(ec2Path, bucketName, cb) {
    function walkSync(currentDirPath, callback) {
        fs.readdirSync(currentDirPath).forEach(function (name) {
            var filePath = path.join(currentDirPath, name);
            var stat = fs.statSync(filePath);
            if (stat.isFile()) {
                callback(filePath, stat);
            } else if (stat.isDirectory()) {
                walkSync(filePath, callback);
            }
        });
    }

    walkSync(ec2Path, function(filePath, stat) {
        let bucketPath = filePath.substring(ec2Path.length + 1);
        let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath) };
        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err)
            } else {
                console.log('Successfully uploaded ' + bucketPath + ' to ' + bucketName);
            }
        });
    });
};

function dbAutoBackUp() {
    let currentDate = new Date();
    var backupPath = prepareBackupPath(currentDate);
    const folderName = '/db-backup/' + prepareFolderName(currentDate);
    var cmd = 'mongodump --uri=mongodb+srv://' + dbConfig.user + ':' + dbConfig.password + '@' + dbConfig.host + '/' + dbConfig.db + ' --out=' + backupPath;
    exec(cmd, (error) => {
        if(!error) {
            uploadDir(backupPath, s3config.bucket + folderName);
            if(fs.existsSync(backupPath)) {
                exec("rm -rf " + backupPath, (error) => {
                    if(!error){
                        console.log("db-backup successful!!");
                    }
                    else {
                        console.log(error);
                    }
                });
            }
        }
    });
}

module.exports = dbAutoBackUp;
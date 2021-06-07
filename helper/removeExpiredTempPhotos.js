const tempPhotoModel = require('../models/tempPhotoModel');

const removeExpiredTempPhotos = () => {
    var threshold7Days = Date.now() - 7 * 24 * 3600000;
    tempPhotoModel.remove({time: {$gt: threshold7Days}}).catch(err => console.log(err));
}

module.exports = removeExpiredTempPhotos;
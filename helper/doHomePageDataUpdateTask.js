const homePageDataModel = require('../models/homePageDataModel');
const allHomePageDataModel = require('../models/allHomePageDataModel');

const doHomePageDataUpdateTask = () => {
    allHomePageDataModel.findOne({},(err,allHomePageData) => {
        if(err) {
            return console.log("ERROR: "+err);
        }
        if(!allHomePageData) {
            return console.log("AllHomePageData collection has no data");
        }

        let categoryNames = [];
        allHomePageData.secondSlider.forEach(item => {
            categoryNames.push(item.categoryName);
        })
        const adModel = require('../models/adModel');
        adModel.aggregate()
        .match({ category: { $in: categoryNames } })
        .group({
            _id : '$category',
            numberOfItems: { $sum: 1}
        })
        .sort({numberOfItems: -1,_id: 1})
        .exec((err,results) => {
            if(err) {
                return console.log(err);
            }

            let newData = [];
            let added = {};
            let i=0;
            while(i < results.length && i < 15) {
                var element = allHomePageData.secondSlider.find(element => element.categoryName === results[i]._id);
                added[element.categoryName] = true;
                newData.push({
                    _id: element.id,
                    categoryName: element.categoryName,
                    numberOfItems: results[i].numberOfItems,
                    photo: element.photo
                })
                i++;
            }
            if(i != 15) {
                let j=0;
                while(i < 15 && j < allHomePageData.secondSlider.length) {
                    let element = allHomePageData.secondSlider[j];
                    if(!added[element.categoryName]) {
                        newData.push({
                            _id: element.id,
                            categoryName: element.categoryName,
                            numberOfItems: 0,
                            photo: element.photo
                        });
                        i++;
                    }
                    j++;
                }
            }

            homePageDataModel.findOne({},(err,homePageData) => {
                if(err) {
                    console.log("ERROR: "+err);
                }
                if(!homePageData) {
                    homePageData = new homePageDataModel({});
                }

                const shuffle = require('shuffle-array');
                homePageData.secondSlider = newData;
                homePageData.topSlider = shuffle(allHomePageData.topSlider).slice(0,5);
                homePageData.latest = shuffle(allHomePageData.latest).slice(0,8);
                homePageData.special = shuffle(allHomePageData.special).slice(0,8);
                homePageData.featured = shuffle(allHomePageData.featured).slice(0,8);
                homePageData.spanA = shuffle(allHomePageData.spanA).slice(0,1);
                homePageData.spanB = shuffle(allHomePageData.spanB).slice(0,2);
                homePageData.spanC = shuffle(allHomePageData.spanC).slice(0,1);
                homePageData.trending = shuffle(allHomePageData.trending).slice(0,8);
                homePageData.bestseller = shuffle(allHomePageData.bestseller).slice(0,8);

                homePageData.markModified("topSlider");
                homePageData.markModified("secondSlider");
                homePageData.markModified("latest");
                homePageData.markModified("special");
                homePageData.markModified("featured");
                homePageData.markModified("spanA");
                homePageData.markModified("spanB");
                homePageData.markModified("spanC");
                homePageData.markModified("trending");
                homePageData.markModified("bestseller");

                homePageData
                .save()
                .then()
                .catch(err => console.log(err));
            });
        });
    });
}

module.exports = doHomePageDataUpdateTask;
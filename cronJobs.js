const cron = require('node-cron');
const doDeliveryStatusUpdateTask = require('./helper/doDeliveryStatusUpdateTask')
const doHomePageDataUpdateTask = require('./helper/doHomePageDataUpdateTask')
const doEverydayInitialization = require('./helper/doEverydayInitialization')
const doWeeklyInitialization = require('./helper/doWeeklyInitialization');
const doMonthlyInitialization = require('./helper/doMonthlyInitialization');
const applyMonthlyChargeOnShop = require('./helper/applyMonthlyChargeOnShop');
const removeExpiredTempPhotos = require('./helper/removeExpiredTempPhotos');
const dbAutoBackUp = require('./db-backup/db-backup')
const mongoose = require('mongoose');
const db = require('./db/db');

var options = {
	scheduled: false,
	timezone: "Asia/Dhaka"
};

var everyDayTask = cron.schedule(
	'00 00 00 * * *',
	() => {
		doEverydayInitialization();
		removeExpiredTempPhotos();
		dbAutoBackUp();
	},
	options
);

var weeklyTask = cron.schedule(
	'00 00 00 * * 6',
	() => {
		doWeeklyInitialization();
	},
	options
);

var monthlyTask = cron.schedule(
	'00 00 00 1 * *',
	() => {
		doMonthlyInitialization();
		applyMonthlyChargeOnShop();
	},
	options
);

var homePageDataUpdateTask = cron.schedule(
	'00 * * * *',
	() => {
		doHomePageDataUpdateTask();
	},
	options
)

var deliveryStatusUpdateTask = cron.schedule(
	'*/15 * * * * *',
	() => {
		doDeliveryStatusUpdateTask();
	},
	options
)

function startCornJobs() {
	everyDayTask.start();
	weeklyTask.start();
	monthlyTask.start();
	homePageDataUpdateTask.start();
	deliveryStatusUpdateTask.start();
	console.log('Cron job started...');
}

mongoose.connect(db.DB,{
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(
	() => {
		console.log('Database is connected')
		startCornJobs();
	},
	err => {console.log('Can not connect to the database' + err)}
);

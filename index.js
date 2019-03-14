const moment = require('moment-timezone');
const program = require('commander');
const ExifImage = require('exif').ExifImage;
const SunCalc = require('suncalc');
const fs = require('fs');
const path = require('path');

const latitude = 59.347652
const longitude = 18.038085


// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

const getExifAsync = (path) => new Promise((resolve, reject) => {
	try {
	    new ExifImage({ image : path }, (error, exifData) => {
	        if (error)
	    		reject(error.message);
	        else
	            resolve(exifData);
	    });
	} catch (error) {
	    rejecT(error);
	}
});

const getSun = date => {
	const {sunriseEnd, sunsetStart} = SunCalc.getTimes(date.toDate(), latitude, longitude);
	sunrise = moment(sunriseEnd);
	sunset = moment(sunsetStart);
	return {sunrise, sunset};
};

program
.arguments('[path]')
// .option('-d, --delete', 'Delete files')
.option('-v, --verbose', 'Verbose mode')
.action((path, a, b) => {
	const files = walkSync(path);
	let day;
	let sunriseEnd;
	let sunsetStart;
	files.forEach(async file => {
		const data = await getExifAsync(file)
		const createDate = moment(data.exif.CreateDate, 'YYYY:MM:DD HH:mm:ss').tz('Europe/Stockholm');
		if (!day || !day.isSame(createDate ,'day')) {
			day = createDate;
			const { sunrise, sunset } = getSun(createDate);
			sunriseEnd = sunrise;
			sunsetStart = sunset;
			if (a.verbose) {
				console.log(`☀️  👆 ${sunriseEnd.format('HH:mm:ss')} 👇 ${sunsetStart.format('HH:mm:ss')}`)
			}
		}
		if (!createDate.isBetween(sunriseEnd, sunsetStart)) {
			console.log(file);
		}
	})
})
.parse(process.argv);

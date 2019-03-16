const moment = require('moment-timezone');
const program = require('commander');
const ExifImage = require('exif').ExifImage;
const SunCalc = require('suncalc');
const fs = require('graceful-fs');
const path = require('path');

const latitude = 59.347652;
const longitude = 18.038085;
const FOLDERNAME = 'Removed_images';


// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = (dir, a) => {
	try {
	    const files = fs.readdirSync(dir);
	    let day;
		let sunriseEnd;
		let sunsetStart;

		//Trying to create a new folder for removed images
		const removeFolder = path.join(dir, FOLDERNAME);
		if (!fs.existsSync(removeFolder) && a.move){
			fs.mkdirSync(removeFolder)
		}

		if (a.verbose) console.log('Processing ', dir);

	    files.forEach(async file => {
	    	const filePath = path.join(dir, file); 
	        if (fs.statSync(filePath).isFile()) {
	        	try {
					const data = await getExifAsync(filePath)
					const createDate = moment(data.exif.CreateDate, 'YYYY:MM:DD HH:mm:ss').tz('Europe/Stockholm');
					// const exposureTime = data.exif.ExposureTime; Mabye later....if needed.
		        	
		        	if (!day || !day.isSame(createDate ,'day')) {
						day = createDate;
						const { sunrise, sunset } = getSun(createDate);
						sunriseEnd = sunrise;
						sunsetStart = sunset;
						if (a.verbose) console.log(`☀️  ${sunriseEnd.format('YYYY-MM-DD')}  👆 ${sunriseEnd.format('HH:mm:ss')} 👇 ${sunsetStart.format('HH:mm:ss')}`)
					}

					if (!createDate.isBetween(sunriseEnd, sunsetStart)) {
						console.log(file);
						if (a.move) {
							fs.renameSync(filePath, path.join(removeFolder, file));
						}
					}
	        	} catch (err) {
	        		if (a.verbose) {
	        			console.error('Error reading file ', file)
	        		}
	        	}
	        } else if (filePath.indexOf(FOLDERNAME) < 0) {
	        	// Process Directory
	            walkSync(filePath, a);
	        }
	    });
	} catch(err) {
		console.error('Error processing ', dir, err);
	}
};

const getExifAsync = path => new Promise((resolve, reject) => {
	fs.readFile(path, (err, image) => {
	  	if (err) reject(err.message);
		new ExifImage({image}, (error, data) => {
			if (error)
	    		reject(error.message);
			else
			    resolve(data);
		});
	});
});

const getSun = date => {
	let {sunriseEnd, sunset} = SunCalc.getTimes(date.toDate(), latitude, longitude);
	sunrise = moment(sunriseEnd).add(1, 'hours');
	sunset = moment(sunset).add(1, 'hours');;
	return {sunrise, sunset};
};

program
.arguments('[path]')
.option('-m, --move', 'Move files')
.option('-v, --verbose', 'Verbose mode')
.action((path, a) => {
	if (path) {
		walkSync(path, a)
	} else {
		console.error('No path provided')
	}
})
.parse(process.argv);

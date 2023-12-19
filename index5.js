// Keep your `Cesium.Ion.defaultAccessToken = 'your_token_here'` line from before here.
const viewer = new Cesium.Viewer("cesiumContainer", {
	terrain: Cesium.Terrain.fromWorldTerrain(),
});

const osmBuildings = await Cesium.createOsmBuildingsAsync();
viewer.scene.primitives.add(osmBuildings);

let coordinates = [];
let header, realData, lo1, la1, dx, dy;
const gk2aData = await Cesium.Resource.fetchJson(
	"../CesiumJS/SampleData/radar_cmp_cappi_202306080600.json"
)
	.then((res) => {
		header = res[0].header;
		realData = res[0].data;
		lo1 = Math.round(header.lo1);
		la1 = Math.round(header.la1);
		dx = header.dx.toFixed(3);
		dy = header.dy.toFixed(3);
	})
	.catch((err) => console.log(err));

// const coordinates = await Cesium.Resource.fetchJson(
// 	"../CesiumJS/SampleData/coordinate.json"
// ).then((res) => {
// 	return res;
// });

for (let i = 0; i < header.nx; i++) {
	for (let j = 0; j < header.ny; j++) {
		let lon = lo1 + dx * i;
		lon = lon > 180 ? lon - 360 : lon;
		coordinates.push([la1 - dy * j, lon]);
	}
}

console.log(coordinates);
console.log(realData);

// let collection = new Cesium.EntityCollection();

for (let i = 0; i < coordinates.length; i++) {
	// let entity = new Cesium.Entity({
	// 	id: i,
	// 	position: Cesium.Cartesian3.fromDegrees(
	// 		coordinates[i][1],
	// 		coordinates[i][0],
	// 		10
	// 	),
	// 	point: { pixelSize: 10, color: Cesium.Color.RED },
	// });

	// viewer.entities.add(entity);

	viewer.entities.add({
		id: i,
		position: Cesium.Cartesian3.fromDegrees(118.0, 35.0),
		point: {
			pixelSize: 100,
			color: Cesium.Color.RED,
		},
	});
}

console.log("viewer", viewer);

// This is one of the first radar samples collected for our flight.
// const dataPoint = { longitude: 127.4756, latitude: 37, height: 180 };
// // Mark this location with a red point.
// console.log(
// 	Cesium.Cartesian3.fromDegrees(
// 		dataPoint.longitude,
// 		dataPoint.latitude,
// 		dataPoint.height
// 	)
// );
// // 37°31'36"N 126°47'56"E
// let projPoint = proj4("EPSG:4326", "EPSG:3857", [126.58, 37.33]);
// viewer.entities.add({
// 	description: `First data point at (${dataPoint.longitude}, ${dataPoint.latitude})`,
// 	position: Cesium.Cartesian3.fromDegrees(
// 		dataPoint.longitude,
// 		dataPoint.latitude,
// 		// projPoint[1],
// 		// projPoint[0],
// 		dataPoint.height
// 	),
// 	point: { pixelSize: 5, color: Cesium.Color.RED },
// });
// Fly the camera to this point.
// viewer.flyTo(pointEntity);

//이동 애니메이션 예제
// const flightData = await Cesium.Resource.fetchJson(
// 	"../CesiumJS/SampleData/tempData.json"
// ).then((res) => {
// 	return res;
// });

// // console.log(flightData);

// /* Initialize the viewer clock:
//     Assume the radar samples are 30 seconds apart, and calculate the entire flight duration based on that assumption.
//     Get the start and stop date times of the flight, where the start is the known flight departure time (converted from PST
//       to UTC) and the stop is the start plus the calculated duration. (Note that Cesium uses Julian dates. See
//       https://simple.wikipedia.org/wiki/Julian_day.)
//     Initialize the viewer's clock by setting its start and stop to the flight start and stop times we just calculated.
//     Also, set the viewer's current time to the start time and take the user to that time.
//   */
// const timeStepInSeconds = 30;
// const totalSeconds = timeStepInSeconds * (flightData.length - 1);
// const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
// const stop = Cesium.JulianDate.addSeconds(
// 	start,
// 	totalSeconds,
// 	new Cesium.JulianDate()
// );
// viewer.clock.startTime = start.clone();
// viewer.clock.stopTime = stop.clone();
// viewer.clock.currentTime = start.clone();
// viewer.timeline.zoomTo(start, stop);
// // Speed up the playback speed 50x.
// viewer.clock.multiplier = 50;
// // Start playing the scene.
// viewer.clock.shouldAnimate = true;

// // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
// const positionProperty = new Cesium.SampledPositionProperty();

// for (let i = 0; i < flightData.length; i++) {
// 	const dataPoint = flightData[i];

// 	// Declare the time for this individual sample and store it in a new JulianDate instance.
// 	const time = Cesium.JulianDate.addSeconds(
// 		start,
// 		i * timeStepInSeconds,
// 		new Cesium.JulianDate()
// 	);
// 	const position = Cesium.Cartesian3.fromDegrees(
// 		dataPoint.longitude,
// 		dataPoint.latitude,
// 		dataPoint.height
// 	);
// 	// Store the position along with its timestamp.
// 	// Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
// 	positionProperty.addSample(time, position);

// 	viewer.entities.add({
// 		description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
// 		position: position,
// 		point: { pixelSize: 10, color: Cesium.Color.RED },
// 	});
// }

// // STEP 4 CODE (green circle entity)
// // Create an entity to both visualize the entire radar sample series with a line and add a point that moves along the samples.
// const airplaneEntity = viewer.entities.add({
// 	availability: new Cesium.TimeIntervalCollection([
// 		new Cesium.TimeInterval({ start: start, stop: stop }),
// 	]),
// 	position: positionProperty,
// 	point: { pixelSize: 30, color: Cesium.Color.GREEN },
// 	path: new Cesium.PathGraphics({ width: 3 }),
// });
// // Make the camera track this moving entity.
// viewer.trackedEntity = airplaneEntity;

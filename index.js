let key =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZTkzNDUzOC0zNzNjLTRiNjgtODEyNC03MGFkN2Q5NmJkYTkiLCJpZCI6MTgwOTMyLCJpYXQiOjE3MDEwNzMzMzh9.LChUlu3p74pFuj6kFCyLkdDZ--9ax2cttsopv1O4nb0";

Cesium.Ion.defaultAccessToken = key;

// const viewer = new Cesium.Viewer("cesiumContainer", {
// 	shouldAnimate: true,
// });

/**
 * This class is an example of a custom DataSource.  It loads JSON data as
 * defined by Google's WebGL Globe, https://github.com/dataarts/webgl-globe.
 * @alias WebGLGlobeDataSource
 * @constructor
 *
 * @param {string} [name] The name of this data source.  If undefined, a name
 *                        will be derived from the url.
 *
 * @example
 * const dataSource = new Cesium.WebGLGlobeDataSource();
 * dataSource.loadUrl('sample.json');
 * viewer.dataSources.add(dataSource);
 */
function WebGLGlobeDataSource(name) {
	//All public configuration is defined as ES5 properties
	//These are just the "private" variables and their defaults.
	this._name = name;
	this._changed = new Cesium.Event();
	this._error = new Cesium.Event();
	this._isLoading = false;
	this._loading = new Cesium.Event();
	this._entityCollection = new Cesium.EntityCollection();
	this._seriesNames = [];
	this._seriesToDisplay = undefined;
	this._heightScale = 10000000;
	this._entityCluster = new Cesium.EntityCluster();
}

Object.defineProperties(WebGLGlobeDataSource.prototype, {
	//The below properties must be implemented by all DataSource instances

	/**
	 * Gets a human-readable name for this instance.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {String}
	 */
	name: {
		get: function () {
			return this._name;
		},
	},
	/**
	 * Since WebGL Globe JSON is not time-dynamic, this property is always undefined.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {DataSourceClock}
	 */
	clock: {
		value: undefined,
		writable: false,
	},
	/**
	 * Gets the collection of Entity instances.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {EntityCollection}
	 */
	entities: {
		get: function () {
			return this._entityCollection;
		},
	},
	/**
	 * Gets a value indicating if the data source is currently loading data.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Boolean}
	 */
	isLoading: {
		get: function () {
			return this._isLoading;
		},
	},
	/**
	 * Gets an event that will be raised when the underlying data changes.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Event}
	 */
	changedEvent: {
		get: function () {
			return this._changed;
		},
	},
	/**
	 * Gets an event that will be raised if an error is encountered during
	 * processing.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Event}
	 */
	errorEvent: {
		get: function () {
			return this._error;
		},
	},
	/**
	 * Gets an event that will be raised when the data source either starts or
	 * stops loading.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Event}
	 */
	loadingEvent: {
		get: function () {
			return this._loading;
		},
	},

	//These properties are specific to this DataSource.

	/**
	 * Gets the array of series names.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {string[]}
	 */
	seriesNames: {
		get: function () {
			return this._seriesNames;
		},
	},
	/**
	 * Gets or sets the name of the series to display.  WebGL JSON is designed
	 * so that only one series is viewed at a time.  Valid values are defined
	 * in the seriesNames property.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {String}
	 */
	seriesToDisplay: {
		get: function () {
			return this._seriesToDisplay;
		},
		set: function (value) {
			this._seriesToDisplay = value;

			//Iterate over all entities and set their show property
			//to true only if they are part of the current series.
			const collection = this._entityCollection;
			const entities = collection.values;
			collection.suspendEvents();
			for (let i = 0; i < entities.length; i++) {
				const entity = entities[i];
				entity.show = value === entity.seriesName;
			}
			collection.resumeEvents();
		},
	},
	/**
	 * Gets or sets the scale factor applied to the height of each line.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Number}
	 */
	heightScale: {
		get: function () {
			return this._heightScale;
		},
		set: function (value) {
			if (value <= 0) {
				throw new Cesium.DeveloperError("value must be greater than 0");
			}
			this._heightScale = value;
		},
	},
	/**
	 * Gets whether or not this data source should be displayed.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {Boolean}
	 */
	show: {
		get: function () {
			return this._entityCollection;
		},
		set: function (value) {
			this._entityCollection = value;
		},
	},
	/**
	 * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
	 * @memberof WebGLGlobeDataSource.prototype
	 * @type {EntityCluster}
	 */
	clustering: {
		get: function () {
			return this._entityCluster;
		},
		set: function (value) {
			if (!Cesium.defined(value)) {
				throw new Cesium.DeveloperError("value must be defined.");
			}
			this._entityCluster = value;
		},
	},
});

/**
 * Asynchronously loads the GeoJSON at the provided url, replacing any existing data.
 * @param {object} url The url to be processed.
 * @returns {Promise} a promise that will resolve when the GeoJSON is loaded.
 */
WebGLGlobeDataSource.prototype.loadUrl = function (url) {
	if (!Cesium.defined(url)) {
		throw new Cesium.DeveloperError("url is required.");
	}

	//Create a name based on the url
	const name = Cesium.getFilenameFromUri(url);

	//Set the name if it is different than the current name.
	if (this._name !== name) {
		this._name = name;
		this._changed.raiseEvent(this);
	}

	//Load the URL into a json object
	//and then process is with the `load` function.
	const that = this;
	return Cesium.Resource.fetchJson(url)
		.then(function (json) {
			return that.load(json, url);
		})
		.catch(function (error) {
			//Otherwise will catch any errors or exceptions that occur
			//during the promise processing. When this happens,
			//we raise the error event and reject the promise.
			this._setLoading(false);
			that._error.raiseEvent(that, error);
			return Promise.reject(error);
		});
};

/**
 * Loads the provided data, replacing any existing data.
 * @param {Array} data The object to be processed.
 */
WebGLGlobeDataSource.prototype.load = function (data) {
	//>>includeStart('debug', pragmas.debug);
	if (!Cesium.defined(data)) {
		throw new Cesium.DeveloperError("data is required.");
	}
	//>>includeEnd('debug');

	//Clear out any data that might already exist.
	this._setLoading(true);
	this._seriesNames.length = 0;
	this._seriesToDisplay = undefined;

	const heightScale = this.heightScale;
	const entities = this._entityCollection;

	//It's a good idea to suspend events when making changes to a
	//large amount of entities.  This will cause events to be batched up
	//into the minimal amount of function calls and all take place at the
	//end of processing (when resumeEvents is called).
	entities.suspendEvents();
	entities.removeAll();

	//WebGL Globe JSON is an array of series, where each series itself is an
	//array of two items, the first containing the series name and the second
	//being an array of repeating latitude, longitude, height values.
	//
	//Here's a more visual example.
	//[["series1",[latitude, longitude, height, ... ]
	// ["series2",[latitude, longitude, height, ... ]]

	// Loop over each series
	console.log(data);
	let header = data[0].header;
	let coor = [];

	let realData = data[0].data;
	let lo1 = Math.round(header.lo1);
	let la1 = Math.round(header.la1);
	let lo2 = Math.round(header.lo2);
	let la2 = Math.round(header.la2);

	let dx = header.dx.toFixed(3);
	let dy = header.dy.toFixed(3);

	let proj777777 =
		"+proj=lcc +lat_1=30 +lat_2=60 +lat_0=38 +lon_0=126 +datum=WGS84 +no_defs";

	for (let i = 0; i < header.nx; i++) {
		for (let j = 0; j < header.ny; j++) {
			// let point = proj4(proj777777, "EPSG:4326", [
			// 	lo1 + dx * i,
			// 	la1 - dy * j,
			// ]);
			coor.push([la1 - dy * j, lo1 + dx * i]);
		}
	}

	let combineData = [];
	for (let i = 0; i < coor.length; i++) {
		if (realData[i] == "NaN") {
			combineData.push(coor[i][1], coor[i][0], 0);
		} else {
			combineData.push(coor[i][1], coor[i][0], realData[i] / 100);
		}
	}
	console.log(combineData);

	for (let x = 0; x < data.length; x++) {
		const series = data[x];
		const seriesName = series[0];
		const coordinates = combineData;

		//Add the name of the series to our list of possible values.
		this._seriesNames.push(seriesName);

		//Make the first series the visible one by default
		const show = x === 0;
		if (show) {
			this._seriesToDisplay = seriesName;
		}

		//Now loop over each coordinate in the series and create
		// our entities from the data.
		for (let i = 0; i < coordinates.length; i += 3) {
			const latitude = coordinates[i];
			const longitude = coordinates[i + 1];
			const height = coordinates[i + 2];

			//Ignore lines of zero height.
			if (height === 0) {
				continue;
			}

			const color = Cesium.Color.fromHsl(0.6 - height * 0.5, 1.0, 0.5);
			const surfacePosition = Cesium.Cartesian3.fromDegrees(
				longitude,
				latitude,
				0
			);
			const heightPosition = Cesium.Cartesian3.fromDegrees(
				longitude,
				latitude,
				height * heightScale
			);

			//WebGL Globe only contains lines, so that's the only graphics we create.
			const polyline = new Cesium.PolylineGraphics();
			polyline.material = new Cesium.ColorMaterialProperty(color);
			polyline.width = new Cesium.ConstantProperty(2);
			polyline.arcType = new Cesium.ConstantProperty(Cesium.ArcType.NONE);
			polyline.positions = new Cesium.ConstantProperty([
				surfacePosition,
				heightPosition,
			]);

			//The polyline instance itself needs to be on an entity.
			const entity = new Cesium.Entity({
				id: `${seriesName} index ${i.toString()}`,
				show: show,
				polyline: polyline,
				seriesName: seriesName, //Custom property to indicate series name
			});

			//Add the entity to the collection.
			entities.add(entity);
		}
	}

	//Once all data is processed, call resumeEvents and raise the changed event.
	entities.resumeEvents();
	this._changed.raiseEvent(this);
	this._setLoading(false);
};

WebGLGlobeDataSource.prototype._setLoading = function (isLoading) {
	if (this._isLoading !== isLoading) {
		this._isLoading = isLoading;
		this._loading.raiseEvent(this, isLoading);
	}
};

//Now that we've defined our own DataSource, we can use it to load
//any JSON data formatted for WebGL Globe.
const dataSource = new WebGLGlobeDataSource();
dataSource
	.loadUrl("../CesiumJS/SampleData/gk2a_ami_le1b_wv069_fd020ge_current.json")
	.then(function () {
		//After the initial load, create buttons to let the user switch among series.
		function createSeriesSetter(seriesName) {
			return function () {
				dataSource.seriesToDisplay = seriesName;
			};
		}

		for (let i = 0; i < dataSource.seriesNames.length; i++) {
			const seriesName = dataSource.seriesNames[i];
			Sandcastle.addToolbarButton(
				seriesName,
				createSeriesSetter(seriesName)
			);
		}
	});

//Create a Viewer instances and add the DataSource.
const viewer = new Cesium.Viewer("cesiumContainer", {
	animation: false,
	timeline: false,
	mapProjection: new Cesium.WebMercatorProjection(),
});
viewer.clock.shouldAnimate = false;
viewer.dataSources.add(dataSource);

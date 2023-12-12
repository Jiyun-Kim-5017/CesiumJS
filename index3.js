let key =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZTkzNDUzOC0zNzNjLTRiNjgtODEyNC03MGFkN2Q5NmJkYTkiLCJpZCI6MTgwOTMyLCJpYXQiOjE3MDEwNzMzMzh9.LChUlu3p74pFuj6kFCyLkdDZ--9ax2cttsopv1O4nb0";

Cesium.Ion.defaultAccessToken = key;

fetch("SampleData/radar_cmp_cappi_202306080600.json")
	.then((res) => {
		return res.json();
	})
	.then((data) => {
		console.log(data);
	});

var czml = [
	{
		id: "document",
		version: "1.0",
	},
	{
		polygon: {
			positions: {
				cartographicDegrees: [
					138.003582, 45.728965, 0, 113.996418, 45.728965, 0,
					116.75326, 29.312252, 0, 135.24674, 29.312252, 0,
				],
			},
			outline: true,
			outlineColor: {
				rgba: [0, 0, 0, 255],
			},
			material: {
				image: {
					image: {
						uri: "SampleData/gk2a_ami_le2_ctps-ctt_ko020lc_202311282350.png",
					},
					alpha: 0.9,
				},
			},
		},
	},
];

const viewer = new Cesium.Viewer("cesiumContainer", {
	baseLayerPicker: false,
});
const imageryLayers = viewer.imageryLayers;

var dataSource = Cesium.CzmlDataSource.load(czml);
viewer.dataSources.add(dataSource);

const viewModel = {
	layers: [],
	baseLayers: [],
	upLayer: null,
	downLayer: null,
	selectedLayer: null,
	isSelectableLayer: function (layer) {
		return this.baseLayers.indexOf(layer) >= 0;
	},
	raise: function (layer, index) {
		imageryLayers.raise(layer);
		viewModel.upLayer = layer;
		viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
		updateLayerList();
		window.setTimeout(function () {
			viewModel.upLayer = viewModel.downLayer = null;
		}, 10);
	},
	lower: function (layer, index) {
		imageryLayers.lower(layer);
		viewModel.upLayer =
			viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
		viewModel.downLayer = layer;
		updateLayerList();
		window.setTimeout(function () {
			viewModel.upLayer = viewModel.downLayer = null;
		}, 10);
	},
	canRaise: function (layerIndex) {
		return layerIndex > 0;
	},
	canLower: function (layerIndex) {
		return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
	},
};
const baseLayers = viewModel.baseLayers;

Cesium.knockout.track(viewModel);

function setupLayers() {
	// Create all the base layers that this example will support.
	// These base layers aren't really special.  It's possible to have multiple of them
	// enabled at once, just like the other layers, but it doesn't make much sense because
	// all of these layers cover the entire globe and are opaque.
	addBaseLayerOption("Bing Maps Aerial", Cesium.createWorldImageryAsync());
	addBaseLayerOption(
		"Bing Maps Road",
		Cesium.createWorldImageryAsync({
			style: Cesium.IonWorldImageryStyle.ROAD,
		})
	);
	addBaseLayerOption(
		"ArcGIS World Street Maps",
		Cesium.ArcGisMapServerImageryProvider.fromUrl(
			"https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
		)
	);
	addBaseLayerOption(
		"OpenStreetMaps",
		new Cesium.OpenStreetMapImageryProvider()
	);
	addBaseLayerOption(
		"Stamen Maps",
		new Cesium.OpenStreetMapImageryProvider({
			url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/",
			fileExtension: "jpg",
			credit: "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.",
		})
	);
	addBaseLayerOption(
		"Natural Earth II (local)",
		Cesium.TileMapServiceImageryProvider.fromUrl(
			Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
		)
	);
	addBaseLayerOption(
		"USGS Shaded Relief (via WMTS)",
		new Cesium.WebMapTileServiceImageryProvider({
			url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS",
			layer: "USGSShadedReliefOnly",
			style: "default",
			format: "image/jpeg",
			tileMatrixSetID: "default028mm",
			maximumLevel: 19,
			credit: "U. S. Geological Survey",
		})
	);

	// Create the additional layers
	addAdditionalLayerOption(
		"United States GOES Infrared",
		new Cesium.WebMapServiceImageryProvider({
			url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?",
			layers: "goes_conus_ir",
			credit: "Infrared data courtesy Iowa Environmental Mesonet",
			parameters: {
				transparent: "true",
				format: "image/png",
			},
		})
	);

	addAdditionalLayerOption(
		"임시",
		new Cesium.WebMapServiceImageryProvider({
			url: "SampleData/gk2a_ami_le1b_rgb-s-true_ko020lc_202311282350.png",
			layers: "임시",
			credit: "Infrared data courtesy Iowa Environmental Mesonet",
			parameters: {
				transparent: "true",
				format: "image/png",
			},
			rectangle: Cesium.Rectangle.fromDegrees(113.996, 25.0, 137.0, 45.0),
		})
	);

	addAdditionalLayerOption(
		"United States Weather Radar",
		new Cesium.WebMapServiceImageryProvider({
			url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?",
			layers: "nexrad-n0r",
			credit: "Radar data courtesy Iowa Environmental Mesonet",
			parameters: {
				transparent: "true",
				format: "image/png",
			},
		})
	);

	// addAdditionalLayerOption(
	// 	"TileMapService Image",
	// 	Cesium.TileMapServiceImageryProvider.fromUrl(
	// 		"../images/cesium_maptiler/Cesium_Logo_Color"
	// 	),
	// 	0.2
	// );

	// addAdditionalLayerOption(
	// 	"Single Image",
	// 	Cesium.SingleTileImageryProvider.fromUrl(
	// 		"../images/Cesium_Logo_overlay.png",
	// 		{
	// 			rectangle: Cesium.Rectangle.fromDegrees(
	// 				-115.0,
	// 				38.0,
	// 				-107,
	// 				39.75
	// 			),
	// 		}
	// 	),
	// 	1.0
	// );

	addAdditionalLayerOption(
		"Grid",
		new Cesium.GridImageryProvider(),
		1.0,
		false
	);

	// addAdditionalLayerOption(
	// 	"Tile Coordinates",
	// 	new Cesium.TileCoordinatesImageryProvider(),
	// 	1.0,
	// 	false
	// );
}

async function addBaseLayerOption(name, imageryProviderPromise) {
	try {
		const imageryProvider = await Promise.resolve(imageryProviderPromise);

		const layer = new Cesium.ImageryLayer(imageryProvider);
		layer.name = name;
		baseLayers.push(layer);
		updateLayerList();
	} catch (error) {
		console.error(`There was an error while creating ${name}. ${error}`);
	}
}

async function addAdditionalLayerOption(
	name,
	imageryProviderPromise,
	alpha,
	show
) {
	try {
		const imageryProvider = await Promise.resolve(imageryProviderPromise);
		const layer = new Cesium.ImageryLayer(imageryProvider);
		layer.alpha = Cesium.defaultValue(alpha, 0.5);
		layer.show = Cesium.defaultValue(show, true);
		layer.name = name;
		imageryLayers.add(layer);
		Cesium.knockout.track(layer, ["alpha", "show", "name"]);
		updateLayerList();
	} catch (error) {
		console.error(`There was an error while creating ${name}. ${error}`);
	}
}

function updateLayerList() {
	const numLayers = imageryLayers.length;
	viewModel.layers.splice(0, viewModel.layers.length);
	for (let i = numLayers - 1; i >= 0; --i) {
		viewModel.layers.push(imageryLayers.get(i));
	}
}

setupLayers();

//Bind the viewModel to the DOM elements of the UI that call for it.
const toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout
	.getObservable(viewModel, "selectedLayer")
	.subscribe(function (baseLayer) {
		// Handle changes to the drop-down base layer selector.
		let activeLayerIndex = 0;
		const numLayers = viewModel.layers.length;
		for (let i = 0; i < numLayers; ++i) {
			if (viewModel.isSelectableLayer(viewModel.layers[i])) {
				activeLayerIndex = i;
				break;
			}
		}
		const activeLayer = viewModel.layers[activeLayerIndex];
		const show = activeLayer.show;
		const alpha = activeLayer.alpha;
		imageryLayers.remove(activeLayer, false);
		imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
		baseLayer.show = show;
		baseLayer.alpha = alpha;
		updateLayerList();
	});

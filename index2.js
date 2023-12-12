let key =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZTkzNDUzOC0zNzNjLTRiNjgtODEyNC03MGFkN2Q5NmJkYTkiLCJpZCI6MTgwOTMyLCJpYXQiOjE3MDEwNzMzMzh9.LChUlu3p74pFuj6kFCyLkdDZ--9ax2cttsopv1O4nb0";

Cesium.Ion.defaultAccessToken = key;

const viewer = new Cesium.Viewer("cesiumContainer", {
	sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
	terrain: Cesium.Terrain.fromWorldTerrain(),
	mapProjection: new Cesium.WebMercatorProjection(),
});
const scene = viewer.scene;
const clock = viewer.clock;

let entity;
let positionProperty;
const dataSourcePromise = Cesium.CzmlDataSource.load("SampleData/truck.czml");
viewer.dataSources.add(dataSourcePromise).then(function (dataSource) {
	entity = dataSource.entities.getById("CesiumMilkTruck");
	positionProperty = entity.position;
});

viewer.camera.setView({
	destination: new Cesium.Cartesian3(
		1216403.8845586285,
		-4736357.493351395,
		4081299.715698949
	),
	orientation: new Cesium.HeadingPitchRoll(
		4.2892217081808806,
		-0.4799070147502502,
		6.279789177843313
	),
	endTransform: Cesium.Matrix4.IDENTITY,
});

try {
	const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(40866);
	viewer.scene.primitives.add(tileset);

	if (scene.clampToHeightSupported) {
		tileset.initialTilesLoaded.addEventListener(start);
	} else {
		window.alert("This browser does not support clampToHeight.");
	}
} catch (error) {
	console.log(`Error loading tileset: ${error}`);
}

function start() {
	clock.shouldAnimate = true;
	const objectsToExclude = [entity];
	scene.postRender.addEventListener(function () {
		const position = positionProperty.getValue(clock.currentTime);
		entity.position = scene.clampToHeight(position, objectsToExclude);
	});
}

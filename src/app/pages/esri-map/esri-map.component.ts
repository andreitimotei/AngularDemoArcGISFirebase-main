/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import { setDefaultOptions, loadModules } from 'esri-loader';
import { Subscription } from "rxjs";
import { FirebaseService, ITestItem } from "src/app/services/database/firebase";
import { FirebaseMockService } from "src/app/services/database/firebase-mock";
import esri = __esri;
import {ReviewsService} from "../../services/database/review.service";
import {AuthenticationService} from "../../services/database/authentication.service";
import {Point} from "./point"; // Esri TypeScript Types

const addReviewAction = {
  title: 'Add Review',
  id: 'add-review'
}

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};



@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  // register Dojo AMD dependencies
  _Map;
  _MapView;
  _FeatureLayer;
  _Graphic;
  _GraphicsLayer;
  _Route;
  _RouteParameters;
  _FeatureSet;
  _Point;
  _locator;
  _Search;
  _Locate;
  _Track;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 12;
  center: Array<number> = [26.10253839, 44.4267674];
  basemap = "streets-vector";
  loaded = false;
  pointCoords: number[] = [26.10253839, 44.4267674];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;

  // firebase sync
  isConnected: boolean = false;
  subscriptionList: Subscription;
  subscriptionObj: Subscription;

  allReviews: any[];

  showReviewField: boolean = false;

  feedback: string;
  rating: number;

  noOfReviews: number;

  errorMessage: string;

  loggedIn: boolean = true;

  logInSubscription: Subscription = new Subscription();

  latitude: number;
  longitude: number;

  constructor(
     //private fbs: FirebaseService
    private fbs: FirebaseMockService,
    private reviewsService: ReviewsService,
    private authenticationService: AuthenticationService
  ) { }

  error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  async initializeMap() {
    try {
      // configure esri-loader to use version x from the ArcGIS CDN
      // setDefaultOptions({ version: '3.3.0', css: true });
      setDefaultOptions({ css: true });

      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet, Search, Locate, Track, Locator] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/widgets/Search",
        "esri/widgets/Locate",
        "esri/widgets/Track",
        "esri/rest/locator"
      ]);

      esriConfig.apiKey = "AAPK9cbc2be54b1d428ebea2e34c18c85f5dPkpte47LmcQtx1LKzjb3n4kC3m6EEWiacP4tLALSpuRovkHZiMIrPAv4koTjijQ9";

      this._Map = Map;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;
      this._Search = Search;
      this._Locate = Locate;
      this._Track = Track;
      this._locator = Locator;

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      this.addFeatureLayers();
      this.addGraphicLayers();

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };
      this.view = new MapView(mapViewProperties);

       // aici am adaugat cautarea locatiei
       const search = new Search({  //Add Search widget
         view: this.view
       });

       this.view.ui.add(search, "top-right"); //Add to the map

       // aici am adaugat localizarea
       const locate = new Locate({
         view: this.view,
         useHeadingEnabled: false,
         goToOverride: function(view, options) {
           options.target.scale = 1500;
           return view.goTo(options.target);
         }
       });
       this.view.ui.add(locate, "top-left");

       // aici am adaugat track your location
       const track = new Track({
         view: this.view,
         graphic: new Graphic({
           symbol: {
             type: "simple-marker",
             size: "12px",
             color: "green",
             outline: {
               color: "#efefef",
               width: "1.5px"
             }
           }
         }),
         useHeadingEnabled: false
       });
       this.view.ui.add(track, "top-left");

       // aici am adaugat rutarea
       const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

       const view = this.view
       this.view.center.latitude = this.latitude;
       this.view.center.longitude = this.longitude;
       this.view.on("double-click", function(event){

             if (view.graphics.filter(graphic => graphic.attributes.type === 'routing').length === 0) {
               addGraphic("origin", event.mapPoint);
               console.log("origin point");
             } else if (view.graphics.filter(graphic => graphic.attributes.type === 'routing').length === 1) {
               addGraphic("destination", event.mapPoint);
               console.log("destination point");

               getRoute(); // Call the route service
             } else {
               console.log("remove route and add new origin");
               view.graphics = view.graphics.filter(graphic => graphic.attributes.type !== 'routing');
               addGraphic("origin", event.mapPoint);
             }

           });

           function addGraphic(type, point) {
             const graphic = new Graphic({
               attributes: {
                 type: 'routing'
               },
               symbol: {
                 type: "simple-marker",
                 color: (type === "origin") ? "white" : "black",
                 size: "8px"
               },
               geometry: point
             });
             view.graphics.add(graphic);
             console.log("added point");
           }

           function getRoute() {
             const routeParams = new RouteParameters({
               stops: new FeatureSet({
                 features: view.graphics.filter(graphic => graphic.attributes.type === 'routing').toArray()
               }),

               returnDirections: true

             });

             route.solve(routeUrl, routeParams)
               .then(function(data) {
                 data.routeResults.forEach(function(result) {
                   result.route.symbol = {
                     type: "simple-line",
                     color: [5, 150, 255],
                     width: 3
                   };
                   view.graphics.add(result.route);
                 });

                 // Display directions
                if (data.routeResults.length > 0) {
                  const directions = document.createElement("ol");
                  directions.classList.add("esri-widget,esri-widget--panel,esri-directions__scroller");
                  directions.style.marginTop = "0";
                  directions.style.background = 'white';
                  directions.style.padding = "15px 15px 15px 30px";
                  const features = data.routeResults[0].directions.features;

                  // Show each direction
                  features.forEach(function(result,i){
                    const direction = document.createElement("li");
                    direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
                    directions.appendChild(direction);
                  });

                 view.ui.empty("bottom-right");
                 view.ui.add(directions, "bottom-right");

                }

               })

               .catch(function(error){
                   console.log(error);
               })
              }

      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on('pointer-move', ["Shift"], (event) => {
        let point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");
      this.view.popup.actions[10] = [];
      this.view.when(()=>{
        this.findPlaces(this.view.center);
      });
      console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
      return this.view;

    } catch (error) {
      console.log("EsriLoader: ", error);
    }

  }

  addGraphicLayers() {
    this.graphicsLayer = new this._GraphicsLayer();
    this.map.add(this.graphicsLayer);
  }

  addFeatureLayers() {
    // Trailheads feature layer (points)
    var shopsLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0"
    });

    this.map.add(shopsLayer);

    console.log("feature layers added");
  }

  stopTimer() {
    if (this.timeoutHandler != null) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  }

  connectFirebase() {
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    this.fbs.connectToDatabase();
    this.subscriptionList = this.fbs.getChangeFeedList().subscribe((items: ITestItem[]) => {
      console.log("got new items from list: ", items);
      this.graphicsLayer.removeAll();
//       for (let item of items) {
//         this.addPoint(item.lat, item.lng, false);
//       }
    });
    this.subscriptionObj = this.fbs.getChangeFeedObj().subscribe((stat: ITestItem[]) => {
      console.log("item updated from object: ", stat);
    });
  }

  getCoordinatesString(x, y) {
    return x.toString() + y.toString();
  }

  getReviewsForStore(idString) {
    if (this.allReviews.filter(review => review.storeId === idString).length > 0) {
      let displayString = 'Reviews: <br><br>';
      this.allReviews
        .filter(review => review.storeId === idString)
        .forEach(review => {
          displayString += `Rating: ${review.rating} <br> ${review.feedback} <br><br><br>`
        })
      return displayString;
    } else {
      return 'This store has no reviews';
    }
  }

  addReview() {
    console.log('add review');
    this.showReviewField = true;
    if (!this.loggedIn) {
      this.errorMessage = "You can only add reviews if you have an account.\nPlease register or log in";
    }
  }

  showResults(results) {
    this.view.popup.close();
    this.view.graphics.removeAll();
    results.forEach((result)=>{
      this.view.graphics.add(
        new this._Graphic({
          attributes: result.attributes,
          geometry: result.location,
          symbol: {
            type: "simple-marker",
            color: "red",
            size: "10px",
            outline: {
              color: "#ffffff",
              width: "2px"
            }
          },
          popupTemplate: {
            title: "{PlaceName}",
            content: "{Place_addr}" + "<br><br>" + result.location.x.toFixed(5) + "," + result.location.y.toFixed(5) + "<br><br>"
                    + this.getReviewsForStore(this.getCoordinatesString(result.location.x, result.location.y)),
            actions: [addReviewAction]
          }
        }));
    });
    if (results.length) {
      const g = this.view.graphics.getItemAt(0);
      this.view.popup.open({
        features: [g],
        location: g.geometry
      });
      this.view.popup.on("trigger-action", (event) => {
        if (event.action.id === 'add-review') {
          console.log(event);
          this.addReview();
        }
      })
    }
  }

  findPlaces(pt) {
    const geocodingServiceUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    const params = {
      categories: ["Grocery"],
      location: pt,
      outFields: ["PlaceName","Place_addr"]
    }

    this._locator.addressToLocations(geocodingServiceUrl, params).then((results)=> {
      this.showResults(results);
    });
  }

  disconnectFirebase() {
    if (this.subscriptionList != null) {
      this.subscriptionList.unsubscribe();
    }
    if (this.subscriptionObj != null) {
      this.subscriptionObj.unsubscribe();
    }
  }

  async getAllReviews() {
    this.allReviews = await this.reviewsService.getReviews();
    this.noOfReviews = this.allReviews.length;
    console.log(this.allReviews);
  }

  async ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");

    navigator.geolocation.getCurrentPosition(pos => this.success(pos));

    this.authenticationService.authStatus.subscribe(response => {
      this.loggedIn = !!response;
    })

    await this.getAllReviews();

    await this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      //this.runTimer();
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
    this.stopTimer();
    this.disconnectFirebase();
  }


  async saveReview() {
    if (!this.rating || this.rating > 10 || this.rating < 1) {
      this.errorMessage = 'Your rating must be a number between 1 and 10';
      return;
    }
    let longitude = typeof this.view.popup.selectedFeature.geometry.get('longitude') === 'number' ? this.view.popup.selectedFeature.geometry.get('longitude') : null;
    let latitude = typeof this.view.popup.selectedFeature.geometry.get('latitude') === 'number' ? this.view.popup.selectedFeature.geometry.get('latitude') : null;
    let storeId = this.getCoordinatesString(longitude, latitude);
    this.reviewsService.addNewReview(this.noOfReviews.toString(), storeId, this.rating, this.feedback || '');
    this.rating = null;
    this.feedback = '';
    this.errorMessage = null;
    this.showReviewField = false;
    await this.getAllReviews();
    this.initializeMap();
  }

  cancel() {
    this.showReviewField = false;
  }

  success(pos) {
    const crd = pos.coords;

    console.log('Your current position is:');
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);

    this.latitude = crd.latitude;
    this.longitude = crd.longitude;
    // this.errorMessage = 'eroare';
  }
}

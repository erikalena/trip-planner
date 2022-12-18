//You should get your API key at https://opentripmap.io
import { OPEN_TRIP_MAP_API_KEY } from '/static/js/config.js';

const pageLength = 5; // number of objects per page

let lon; // place longitude
let lat; // place latitude

let offset = 0; // offset from first object in the list
let count; // total objects count



export default {
    name: 'main',
    template: `
    <div id="div_display" class="container">
        <form id="search_form" class="input-group mb-4 border p-1" >
            <div class="input-group-prepend border-0">
                <button id="button-search" type="submit" class="btn btn-link ">
                    <i class="fa fa-search"></i>
                </button>
            </div>
            <input id="textbox"  type="search" placeholder="Region, city, village, etc. (e.g. Moscow)"
                aria-describedby="button-search"
                class="form-control bg-none border-0"
                @change="submitForm"
            />
        </form>
    
        <div id="info" class="alert alert-primary"></div>
        <div class="row">
            <div class="col-12 col-lg-5">
                <div id="list" class="list-group"></div>
                <nav class="text-center">
                    <button id="next_button" type="button" class="btn btn-primary" style="visibility: hidden;" @click="next();">
                        Next
                    </button>
                </nav>
            </div>
            <div class="col-12 col-lg-7">
                <div id="poi" class="alert"></div>
            </div>
        </div>
    </div>
    <link rel="stylesheet" href="static/css/explore.css">
    `,
    methods: {
        apiGet(method, query) {
            return new Promise(function (resolve, reject) {
                var otmAPI =
                    "https://api.opentripmap.com/0.1/en/places/" +
                    method +
                    "?apikey=" +
                    OPEN_TRIP_MAP_API_KEY;
                if (query !== undefined) {
                    otmAPI += "&" + query;
                }
                fetch(otmAPI)
                    .then(response => response.json())
                    .then(data => resolve(data))
                    .catch(function (err) {
                        console.log("Fetch Error :-S", err);
                    });
            });
        },
        
        
        
        onShowPOI(data) {
            let poi = document.getElementById("poi");
            poi.innerHTML = "";
            if (data.preview) {
                poi.innerHTML += `<img src="${data.preview.source}">`;
            }
            poi.innerHTML += data.wikipedia_extracts
                ? data.wikipedia_extracts.html
                : data.info
                    ? data.info.descr
                    : "No description";
        
            poi.innerHTML += `<p><a target="_blank" href="${data.otm}">Show more at OpenTripMap</a></p>`;
        },

        createListItem(module,item) {
            let a = document.createElement("a");
            a.className = "list-group-item list-group-item-action";
            a.setAttribute("data-id", item.xid);
            a.innerHTML = `<h5 class="list-group-item-heading">${item.name}</h5>
              <p class="list-group-item-text">${getCategoryName(item.kinds)}</p>`;
        
            a.addEventListener("click", function () {
                document.querySelectorAll("#list a").forEach(function (item) {
                    item.classList.remove("active");
                });
                this.classList.add("active");
                let xid = this.getAttribute("data-id");
                module.apiGet("xid/" + xid).then(data => module.onShowPOI(data));
            });
            return a;
        },
        
        loadList(module,lon, lat) {
            this.apiGet(
                "radius",
                `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=json`
            ).then(function (data) {
                let list = document.getElementById("list");
                list.innerHTML = "";
                data.forEach(item => list.appendChild(module.createListItem(module,item)));
                let nextBtn = document.getElementById("next_button");
                if (count < offset + pageLength) {
                    nextBtn.style.visibility = "hidden";
                } else {
                    nextBtn.style.visibility = "visible";
                    nextBtn.innerText = `Next (${offset + pageLength} of ${count})`;
                }
            });
        },
        
        firstLoad(module,lon, lat) {
            this.apiGet(
                "radius",
                `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=count`
            ).then(function (data) {
                count = data.count;
                offset = 0;
                document.getElementById("info").innerHTML += `<p>${count} objects with description in a 1km radius</p>`;
                module.loadList(module,lon, lat);
            });
        },

        
        submitForm() {
            var module = this;
            let name = document.getElementById("textbox").value;
            this.apiGet("geoname", "name=" + name).then(function (data) {
                let message = "Name not found";
                if (data.status == "OK") {
                    message = data.name + ", " + getCountryName(data.country);
                    lon = data.lon;
                    lat = data.lat;
                    module.firstLoad(module,lon, lat);
                }
                document.getElementById("info").innerHTML = `<p>${message}</p>`;
            });
        },


        next() {
            offset += pageLength;
            this.loadList(this, lon, lat);
        }
       
    }
}
 
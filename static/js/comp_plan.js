//You should get your API key at https://opentripmap.io
import { OPEN_TRIP_MAP_API_KEY } from '/static/js/config.js';
const apiKey = OPEN_TRIP_MAP_API_KEY;

const pageLength = 1000; // number of objects per page, set an high number, we essentially want them all

let lon; // place longitude
let lat; // place latitude

let offset = 0; // offset from first object in the list
let count; // total objects count



export default {
    name: 'main',
    template: `
    <div id="div_search" class="container">
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
    
        <div id="info" class="response"></div>

        <div id="div_options" ></div>
        
            <nav class="text-center">
                <button id="next_button" type="button" class="btn btn-primary" style="visibility: hidden;" @click="submit();">
                    Next
                </button>
            </nav>
   
    </div>

    `,
    methods: {
        apiGet(method, query) {
            return new Promise(function (resolve, reject) {
                var otmAPI =
                    "https://api.opentripmap.com/0.1/en/places/" +
                    method +
                    "?apikey=" +
                    apiKey;
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

        // create a checkbox list
        createListItem(module,data) {
            let div =  document.getElementById("div_options");
            let form = document.createElement("form");
            let inner_div = document.createElement("div");
            let insertedKinds = [];

            div.appendChild(form);
            form.appendChild(inner_div);
            form.id = "form_options";
            inner_div.id = "div_kinds";

            for (var item of data) {
                let kind = getCategoryName(item.kinds);
                if (!insertedKinds.find(e => e == kind)) {
                    inner_div.innerHTML += `<input type="checkbox" id="${kind}" name="${kind}" value="${kind}" checked/><label for=${kind}>${kind}</label><br>`;
                    insertedKinds.push(kind);
                }
            }
            module.addOptions(form);
            return form;
        },
        
        // add options to the form
        addOptions(form) {
            form.innerHTML += `<br><br><label for="days" style="font-weight:600;">How many days are you going to stay?</label>
            <input type="number" id="days" name="days" min="1" max="7"></input>`;
        },

        // load all type of places found in the area
        loadKinds(module,lon, lat) {
            this.apiGet(
                "radius",
                `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=json`
            ).then(function (data) {
                let list = document.getElementById("div_options");
                list.innerHTML = "";
                list.appendChild(module.createListItem(module, data))
           });
        },

        // load data from API
        firstLoad(module,lon, lat) {
            this.apiGet(
                "radius",
                `radius=1000&limit=${pageLength}&offset=${offset}&lon=${lon}&lat=${lat}&rate=2&format=count`
            ).then(function (data) {
                count = data.count;
                offset = 0;
                document.getElementById("info").innerHTML += `<p>${count} Point of Interest found in a 1km radius belonging to the following categories.\n 
                Uncheck those you are not interested in.</p>`;
                module.loadKinds(module,lon,lat);
                
                let nextBtn = document.getElementById("next_button");
                nextBtn.style.visibility = "visible";
                nextBtn.innerText = `Next`;
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


        submit() {
            console.log('here');
            $.ajax({
                type: "POST",
                enctype: 'multipart/form-data',
                url: "/src/plan?",
                data: data,
                processData: false,
                contentType: false,
                cache: false,
                success: (data) =>{
                    console.log("success");
                    console.log(data);
                },
                error: function (e) {
                    console.log("error");
                }
            });
        }
    }
}
 
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

    <div id="div_display" class="container">
    <p   style="font-weight: 600;"> Search for your place of interest, then you will be asked some really simple information to build your trip plan. </p>
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
                    module.firstLoad(module,lon,lat);
                }
                document.getElementById("info").innerHTML = `<p>${message}</p>`;
            });
        },

        add_days(days) {
            for (var i = 0; i < days; i += 1) {
                let div_day = $(`
                    <div class="div_days" id="div_days_${i}" >
                        <h2 class="div_days_title"> Day ${i+1} </h2>
                    </div>
                `);
                $("#div_display").append(div_day);
            } 
        },

        plan(data, days, checked) {
            // remove the places that are not checked
            for (var i = 0; i < data.length; i += 1) {
                let item = data[i];
                let kind = getCategoryName(item.kinds);
                if(!checked.includes(kind)) {
                    data.splice(i, 1);
                    i -= 1;
                }
            }

            jQuery.fn.sort = function() {  
                return this.pushStack( [].sort.apply( this, arguments ), []);  
            } 
            
            function sortRate(a,b){  
                if (a.rate == b.rate){
                return 0;
                }
                return a.rate > b.rate ? -1 : 1;  
            }
            // select the best places for each day based on the rate
            let sorted = $(data).sort(sortRate); 
            let per_day = 5;
            let chosen = sorted.slice(0, days*per_day);

            $("#div_display").empty();

            this.add_days(days);

            for (var i = 0; i < days*per_day; i += 1) {
                let item = chosen[i];          

                let place = $(`
                    <div class="places">
                        <p class="name_places" style="font-weight:bold"> ${item.name} </p>
                        <p class="description"> ${getCategoryName(item.kinds)} </p>
                    </div>
                `);

                let index = Math.floor(i/per_day);
                $(`#div_days_${index}`).append(place);
            }

        },

        submit() {
            
            let days = document.getElementById("days").value;
            let method = "radius";
            let query = `radius=1000&limit=1000&offset=5&lon=${lon}&lat=${lat}&rate=2&format=json`
            var url = "https://api.opentripmap.com/0.1/en/places/" + method + "?apikey=" + apiKey + "&" + query;
            var module = this;

            let checked = []
            var checkboxes = document.querySelectorAll('input[type=checkbox]:checked')

            for (var i = 0; i < checkboxes.length; i++) {
            checked.push(checkboxes[i].value)
            }
            
            console.log(checked);
            $.ajax({
                type: "GET",
                dataType: "json",
                cache: false,
                url: url,
                success: (data) =>{
                    module.plan(data, days, checked);
                },
                error: function (e) {
                    console.log("error in get story", e);
                }
            });
        }
    }
}
 
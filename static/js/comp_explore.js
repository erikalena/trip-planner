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
            <input id="textbox"  type="search" placeholder="Region, city, village, etc. (e.g. Rome)"
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
                <div id="poi" class="alert" style="visibility: hidden;"></div>
            </div>
        </div>
    </div>

    <!-- modal for visualizing json -->
    <div class="modal fade" id="showjsonModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body" id="jsonModal"></div>
            </div>
        </div>
    </div>


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
        getMeta(url, data) {   
            var img = new Image();
            img.onload = function() {
                let poi = document.getElementById("poi");
                poi.innerHTML = "";

                poi.innerHTML += `<p class="opentrip_link"><a target="_blank" href="${data.otm}">Show more at OpenTripMap</a></p><button type="button" class="btn_showjson" data-toggle="modal" data-target="#showjsonModal" >Check data</button><br>`;

                let content = `<div class='poi_content'>`;
                alert( this.width +" "+ this.height );
                let gt = this.width > this.height + 50;
                console.log(gt);
                if (data.preview && gt)  {
                    content += `<img id="content_img" src="${data.preview.source}" style="width=100% !important;" >`;
                }
                else if (data.preview) {
                    content += `<img id="content_img" src="${data.preview.source}" >`;
                }

                content += data.wikipedia_extracts
                    ? data.wikipedia_extracts.html
                    : data.info
                        ? data.info.descr
                        : "No description";

                content += `</div>`;
                poi.innerHTML += content;

                if (gt) {
                    $(".poi_content > p").css("width","100%");
                }
            };
            
            img.src = url;

        },
        load_image(data, poi) {
            // check img dimensions and change width of image and description
            var img = new Image();
            img.onload = function() {
                let content = `<div class='poi_content'>`;
                let gt = this.width > this.height + 50 ;
              
                content += `<img id="content_img" src="${data.preview.source}" >`;

                content += data.wikipedia_extracts
                    ? data.wikipedia_extracts.html
                    : data.info
                        ? data.info.descr
                        : "No description";

                content += `</div>`;
                poi.innerHTML += content;

                if (gt) {
                    $(".poi_content > img").css("width","100%");
                    $(".poi_content > p").css("width","100%");
                }
            };
            img.src = data.preview.source;
        },
        onShowPOI(data) {
            let poi = document.getElementById("poi");
            poi.innerHTML = "";
            poi.style.visibility = "visible";

            poi.innerHTML += `<p class="opentrip_link"><a target="_blank" href="${data.otm}">Show more at OpenTripMap</a></p><button type="button" class="btn_showjson" data-toggle="modal" data-target="#showjsonModal" >Check data</button><br>`;

            if (data.preview) {
                this.load_image(data, poi);
            }
            else {
                let content = `<div class='poi_content'>`;

                content += data.wikipedia_extracts
                    ? data.wikipedia_extracts.html
                    : data.info
                        ? data.info.descr
                        : "No description";

                content += `</div>`;
                poi.innerHTML += content;
                $(".poi_content > p").css("width","100%");
            }
            
            $("#showjsonModal").on("shown.bs.modal", function () {
                let text = JSON.stringify(data, null, 2);
                text = text.replace(/\n/g,"<br />");
                $("#jsonModal").html(text);
            });

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
                console.log(data);
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
 
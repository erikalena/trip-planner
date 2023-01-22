import { queryPoi } from '/static/js/queries.js';
import cityCodes from '/static/data/cityCode.json' assert {type: 'json'};


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
            <div class="col-12 ">
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
        errorCityNotFound(message) {
            console.log("error ", e);
            document.getElementById("info").innerHTML = `<p>${message}</p>`;
        },
        findCode(name) {
            var code = null;
            cityCodes.forEach(item => {
                if (item.cityLabel.toLowerCase() == name) {
                    let idx = item.city.lastIndexOf("/");
                    code = item.city.slice(idx+1);
                }
            });
            return code;
        },
        submitForm() {
            var module = this;
            var name = document.getElementById("textbox").value;
            var code = null;

            if (name) {
                code = this.findCode(name.toLowerCase());

                if (code == null) {
                    this.errorCityNotFound("City not found");
                }
                console.log(code);
                var url = "https://query.wikidata.org/sparql";
                /* var query = `SELECT DISTINCT ?item ?itemLabel ?lat ?long WHERE {
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "it". }
                    {
                    SELECT ?item (SAMPLE(?lat) AS ?lati) (SAMPLE(?long) AS ?longi) WHERE {
                        ?item p:P131 ?statement0.
                        ?item wdt:P31/wdt:P279* wd:Q33506 . 
                        ?statement0 (ps:P131/(wdt:P131*)) wd:${code}.
                        ?item p:P625/psv:P625 [  wikibase:geoLatitude ?lat;   wikibase:geoLongitude ?long ] .
                        
                    } group by ?item
                    }
                }`; */
                var query = `SELECT ?item ?itemLabel (SAMPLE(?coords) AS ?coords) (SAMPLE(?image) AS ?image) (SAMPLE(?label) AS ?label) ( COUNT( ?sitelink ) AS ?sitelink_count ) WHERE {
                    ?item wdt:P131 wd:${code}.
                    OPTIONAL { ?item wdt:P625 ?coords.}
                    OPTIONAL { ?item wdt:P18 ?image. }
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "it". }
                    OPTIONAL { ?item wdt:P7367 ?descrittore_di_contenuto. }
                    { ?item wdt:P31 wd:Q33506.}UNION 
                    { ?item wdt:P31 wd:Q174782.} UNION 
                    {  ?item wdt:P31 wd:Q839954.} UNION 
                    {  ?item wdt:P31 wd:Q16970.}
                   
                    ?item wdt:P31 ?descr .
                    ?descr rdfs:label ?label .  FILTER( LANG(?label)="it" )
                    ?sitelink schema:about ?item.
                  } Group by ?item ?itemLabel `;
                var queryUrl = url + "?query="+ query;
                
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    cache: false,
                    url: queryUrl,
                    success: (data) =>{
                        console.log(data);
                        console.log(data.results.bindings[0]);
                        // get the table element
                        let count = data.results.bindings.length; 
                        document.getElementById("info").innerHTML = `<p>${count} points of interest found</p>`;
                        
                        let poi = document.getElementById("poi");
                        poi.style.visibility = "visible"; 
                        poi.innerHTML = "";
                        data.results.bindings.forEach(item => {
                            module.loadList(module, item);
                        });
                    },
                    error: function (e) {
                        console.log("error ", e);
                        document.getElementById("info").innerHTML = `<p>City not found</p>`;
                    }
                });
            }
            else {
                this.errorCityNotFound("Wrong input provided");
            }
        },

        loadList(module, item) {
        
            let a = document.createElement("a");
            a.className = "list-group-item list-group-item-action";
            a.type = "button";
            a.className += "btn_showjson";
            a.setAttribute("data-toggle", "modal");
            a.setAttribute("data-target", "#showjsonModal");
            let uri =  item.item.value;
            a.setAttribute("id", uri);
            
            let idx = uri.lastIndexOf("/");
            let id = uri.slice(idx+1).replace(/_/g, " ");
            let image = null;
            if (item.image) image = item.image.value;
            let name = item.itemLabel.value;
            a.setAttribute("itemName", name);

            a.innerHTML = ` <h5 class="list-group-item-heading">${name}</h5>
                <p class="list-group-item-text"> ${item.label.value}</p>`;
        
            a.addEventListener("click", function () {
                document.querySelectorAll("#list a").forEach(function (item) {
                    item.classList.remove("active");
                });
                this.classList.add("active");
                
                module.onShowPOI(module, id, name, image, uri);
            });

            document.getElementById("poi").appendChild(a);
                    
        },
        onShowPOI(module, id, name, img, uri) {
          
            let queryUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&ids=${id}&sitefilter=itwiki`;
            //find title to search on wikipedia
            $.ajax({
                type: "GET",
                dataType: "jsonp",
                cache: false,
                url: queryUrl,
                success: (data) =>{
                    let title = data.entities[Object.keys(data.entities)[0]].sitelinks.itwiki.title;
                    if (title)  {
                        let url = "https://it.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1";
                        let queryUrl = url + "&titles=" + title ;
                        $.ajax({
                            type: "GET",
                            dataType: "jsonp",
                            cache: false,
                            url: queryUrl,
                            success: (data) =>{
                                console.log(data);
                                let extract = '';
                                if (Object.keys(data.query.pages)[0] != "-1") { // extract found
                                    extract = data.query.pages[Object.keys(data.query.pages)[0]].extract;
                                }
                                else {
                                    extract = "No extract found";
                                }

                                module.showModal(extract, img, uri);
                                            
                            }
                        }); 
                    }
                }
            });

        },
        showModal(extract, img, uri) {
            $("#showjsonModal").on("shown.bs.modal", function () {
                $("#jsonModal").empty();

                // add link to wikidata
                let a = document.createElement("a");
                a.setAttribute("href", uri);
                a.innerHTML = "View on Wikidata";
                document.getElementById("jsonModal").appendChild(a);

                // add extract
                let p = document.createElement("p");
                p.innerHTML = extract;
                document.getElementById("jsonModal").appendChild(p);

                // add image if available
                if (img) {
                    let imgTag = document.createElement("img");
                    imgTag.setAttribute("src", img);
                    imgTag.setAttribute("width", "100%");
                    document.getElementById("jsonModal").appendChild(imgTag);
                }
                
            });
        }
    }

  
    
}
 
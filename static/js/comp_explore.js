import cityCodes from '/static/data/cityCode.json' assert {type: 'json'};


export default {
    name: 'explore',
    template: `
    <div id="div_display" class="container">
    <p   style="font-weight: 600;"> Search for an Intalian city you are interested in and explore the point of interest you can visit during your future journey. </p>
        <form id="search_form" class="input-group mb-4 border p-1" >
            <div class="input-group-prepend border-0">
                <button id="button-search" type="submit" class="btn btn-link ">
                    <i class="fa fa-search"></i>
                </button>
            </div>
            <input id="textbox"  type="search" placeholder="Region, city, village, etc. (e.g. Roma)"
                aria-describedby="button-search"
                class="form-control bg-none border-0"
                @change="load();submitForm();"
            />
        </form>
        <div id="loading" style="visibility:hidden; height:0px"><p> Loading from Wikidata...</p><div></div></div>
        <div id="info" class="alert alert-primary" style="visibility:hidden;"></div>
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
        load()  {   
            $("#loading").css("visibility", "visible");
            $("#loading").css("height", "80px");
            $("#info").css("visibility", "hidden");
            $("#poi").css("visibility", "hidden");
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
                
                var url = "https://query.wikidata.org/sparql";
            
                var query = `SELECT ?item ?itemLabel (SAMPLE(?coords) AS ?coords) (SAMPLE(?image) AS ?image) (SAMPLE(?label) AS ?label) ( COUNT( ?sitelink ) AS ?sitelink_count ) WHERE {
                    ?item wdt:P131 wd:${code}.
                    OPTIONAL { ?item wdt:P625 ?coords.}
                    OPTIONAL { ?item wdt:P18 ?image. }
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "it". }

                    { 
                        ?item wdt:P31 wd:Q33506. 
                        wd:Q33506 rdfs:label ?label.
                        FILTER((LANG(?label)) = "it")
                    }
                    UNION
                    { 
                        ?item wdt:P31 wd:Q174782. 
                        wd:Q174782 rdfs:label ?label.
                        FILTER((LANG(?label)) = "it")
                    }
                    UNION
                    { 
                        ?item wdt:P31 wd:Q839954. 
                        wd:Q839954 rdfs:label ?label.
                        FILTER((LANG(?label)) = "it")
                    }
                    UNION
                    { 
                        ?item wdt:P31 wd:Q16970.
                        wd:Q16970 rdfs:label ?label.
                        FILTER((LANG(?label)) = "it")
                    }
                   
                    ?item wdt:P31 ?descr .
                    ?descr rdfs:label ?label .  FILTER( LANG(?label)="it" )
                    ?sitelink schema:about ?item.
                  } 
                  group by ?item ?itemLabel 
                  order by desc(?sitelink_count)`;
                var queryUrl = url + "?query="+ query;
                
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    cache: false,
                    url: queryUrl,
                    success: (data) =>{
                        $("#loading").css("visibility", "hidden");
                        $("#loading").css("height", "0px");
                        $("#info").css("visibility", "visible");
                        $("#poi").css("visibility", "visible");
                        console.log(data.results.bindings[0]);
                        // get the table element
                        let count = data.results.bindings.length; 
                        document.getElementById("info").innerHTML = `<p>${count} points of interest found</p>`;
                        
                        let poi = document.getElementById("poi");
                        poi.style.visibility = "visible"; 
                        poi.innerHTML = "";
                        data.results.bindings.forEach(item => {
                            module.loadList(module, item, name);
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

        loadList(module, item, city) {
        
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
                <p class="list-group-item-text" style="float:left;"> ${item.label.value}</p> 
                <p class="list-group-item-text" style="float:right; font-weight: 300;"> Site links: ${item.sitelink_count.value}</p>`;
        
            a.addEventListener("click", function () {
                document.querySelectorAll("#list a").forEach(function (item) {
                    item.classList.remove("active");
                });
                this.classList.add("active");
                
                module.onShowPOI(module, id, name, image, uri, city);
            });

            document.getElementById("poi").appendChild(a);
                    
        },
        onShowPOI(module, id, name, img, uri, city) {
          
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

                                module.showModal(city, name, extract, img, uri);
                                            
                            }
                        }); 
                    }
                }
            });

        },
        showModal(city, poiTitle, extract, img, uri) {
            $("#showjsonModal").on("shown.bs.modal", function () {
                $("#jsonModal").empty();

                // add link to wikidata
                let a = document.createElement("a");
                a.setAttribute("href", uri);
                a.innerHTML = "View on Wikidata";
                document.getElementById("jsonModal").appendChild(a);

                //add title
                let h4 = document.createElement("h4");
                let cityName = city.charAt(0).toUpperCase() + city.slice(1);
                h4.textContent = `POI in ${cityName}: ${poiTitle}`;
                document.getElementById("jsonModal").appendChild(h4);

                // add div
                let div = document.createElement("div");
                div.setAttribute("id", "modalContent");
                document.getElementById("jsonModal").appendChild(div);

                // add extract
                let p = document.createElement("p");
                p.innerHTML = extract;
                document.getElementById("modalContent").appendChild(p);

                // add image if available
                if (img) {
                    let imgTag = document.createElement("img");
                    imgTag.setAttribute("src", img);
                    document.getElementById("modalContent").appendChild(imgTag);

                    imgTag.style.width = "100%";
    
                }
                
            });
        }
    }

  
    
}
 
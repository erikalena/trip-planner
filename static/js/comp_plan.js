import cityCodes from '/static/data/cityCode.json' assert {type: 'json'};


var data ;
var days ;

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
                Get Plan
            </button>
        </nav>    

       
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
                        module.data = data.results.bindings;
                        // get the table element
                        let count = data.results.bindings.length; 
                        document.getElementById("info").innerHTML = `<p>${count} points of Interest found belonging to the following categories.\n 
                                                    Uncheck those you are not interested in.</p>`;

                        let list = document.getElementById("div_options");
                        list.innerHTML = "";
                        list.appendChild(module.createListItem(module, data.results.bindings));
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

        
        // add option for the number of days to the form
        addOptions(form) {
            form.innerHTML += `<br><br><label for="days" style="font-weight:600;">How many days are you going to stay?</label>
            <input type="number" id="days" name="days" min="1" max="7"></input>`;

            // set plan button visible
            let nextBtn = document.getElementById("next_button");
            nextBtn.style.visibility = "visible";
            nextBtn.innerText = `Next`;
        },

      
        // create a checkbox list
        createListItem(module, data) {
            console.log('create list' ,data);
            let div =  document.getElementById("div_options");
            let form = document.createElement("form");
            let inner_div = document.createElement("div");
            let insertedKinds = [];

            div.appendChild(form);
            form.appendChild(inner_div);
            form.id = "form_options";
            inner_div.id = "div_kinds";

            for (var item of data) {
                let kind = item.label.value;
                if (!insertedKinds.find(e => e == kind)) {
                    inner_div.innerHTML += `<input type="checkbox" id="${kind}" name="${kind}" value="${kind}" checked/><label for=${kind}>${kind}</label><br>`;
                    insertedKinds.push(kind);
                }
            }
            module.addOptions(form);
            return form;
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

        plan(days, checked) {
 
            // remove the places that are not checked
            for (var i = 0; i < this.data; i += 1) {
                let item = this.data[i];
                let kind = item.label.value;
                if(!checked.includes(kind)) {
                    this.data.splice(i, 1);
                    i -= 1;
                }
            }

            jQuery.fn.sort = function() {  
                return this.pushStack( [].sort.apply( this, arguments ), []);  
            } 
            
            // enties are evaluated with respect to their number of sitelinks
            function sortRate(a,b){  
                if (a.sitelink_count == b.sitelink_count){
                return 0;
                }
                return a.sitelink_count > b.sitelink_count ? -1 : 1;  
            }
            // select the best places for each day based on the rate
            let sorted = this.data.sort(sortRate); 
            let per_day = 5;
            let chosen = sorted.slice(0, days*per_day);
            
            console.log(chosen);
            console.log('sorted', sorted);
            console.log(checked);
            $("#div_display").empty();

            this.add_days(days);

            for (var i = 0; i < days*per_day; i += 1) {
                let item = chosen[i];          

                let place = $(`
                    <div class="places">
                        <p class="name_places" style="font-weight:bold"> ${item.itemLabel.value} </p>
                        <p class="description"> ${item.label.value} </p>
                    </div>
                `);

                let index = Math.floor(i/per_day);
                $(`#div_days_${index}`).append(place);
            } 

        },

        submit() {
            let days = document.getElementById("days").value;
           
            let checked = []
            var checkboxes = document.querySelectorAll('input[type=checkbox]:checked')

            for (var i = 0; i < checkboxes.length; i++) {
                checked.push(checkboxes[i].value)
            }
            
            this.plan(days, checked);
        }

    }
}
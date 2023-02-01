import cityCodes from '/static/data/cityCode.json' assert {type: 'json'};
import {users} from '/static/js/config.js';

var trip = {content: {}};

var ndays = 0;
var cityCode = null;
var cityLabel = null;
var perDay = 5; // number of poi per day
var chosen = []; // array of chosen poi

export default {
    name: 'plan',
    template: `

    <div id="div_display" class="container">
    <a id = "downloadBtn" class="btn btn-primary" download="trip.json" href=""  @click="download();" style="visibility:hidden">Download</a>
    <a id="saveBtn" type="button" class="btn btn-primary" @click="save();"  style="visibility:hidden" > Save  </a>
    <div id="div_content" class="container">
        <p   style="font-weight: 600;"> Search for your place of interest, then you will be asked some really simple information to build your trip plan. </p>
            <div id="search_form" class="input-group mb-4 border p-1" >
                <div class="input-group-prepend border-0">
                    <button id="button-search" type="submit" class="btn btn-link ">
                        <i class="fa fa-search"></i>
                    </button>
                </div>
                <input id="textbox"  type="search" placeholder="Region, city, village, etc. (e.g. Roma)"
                    aria-describedby="button-search"
                    class="form-control bg-none border-0"
                    @change="submitForm();"
                />
            </div>


            <div id="loading" style="visibility:hidden"><p> Loading from Wikidata...</p><div></div></div>

            <div id="info" class="response"></div>
            <div id="div_options" ></div>
            
            <nav class="text-center">
                <button id="next_button" type="button" class="btn btn-primary" style="visibility: hidden;" @click="submit();">
                    Get Plan
                </button>
            </nav>    

    </div>
    
    </div>
        <!-- modal for login -->
        <div class="modal fade" id="loginModal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    </div>
                    <div class="modal-body" >
                        <p id = "login_error" style="color:red"></p>
                        <form>
                        <label for="uname"><b>Username</b></label>
                        <input id= "username" type="text" placeholder="Enter Username" name="uname" required>

                        <label for="psw"><b>Password</b></label>
                        <input id = "password" type="password" placeholder="Enter Password" name="psw" required>
                        </form>
                        <button type="submit"  @click="login();">Login</button>

                        <a href="/register">Register</a>
                    </div>
                </div>
            </div>
        </div>
    `,
    methods: {
        errorCityNotFound(message) {
            $("#loading").css("visibility", "hidden");
            $("#loading").css("height", "0px");
            $("#info").css("visibility", "visible");
            $("#poi").css("visibility", "hidden");
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
            document.getElementById("loading").style.visibility = "visible";
        },
        submitForm() {
            this.load();
            var module = this;
            var name = document.getElementById("textbox").value;
            var code = null;

            if (name) {
                code = this.findCode(name.toLowerCase());
                
                if (code == null) {
                    this.errorCityNotFound("City not found");
                    return;
                }
                cityCode = code;
                cityLabel = name;
                var url = "https://query.wikidata.org/sparql";
                
                var query = `SELECT ?item ?itemLabel (SAMPLE(?coords) AS ?coords) (SAMPLE(?image) AS ?image) ?label ( COUNT( ?sitelink ) AS ?sitelink_count ) WHERE {
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
                  } Group by ?item ?itemLabel ?label`;

                var queryUrl = url + "?query="+ query;
                
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    cache: false,
                    url: queryUrl,
                    success: (data) =>{
                        $('#loading').hide();
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
        
        addDays(days) {
            for (var i = 0; i < days; i += 1) {
                let div_day = $(`
                    <div class="div_days" id="div_days_${i}" >
                        <h2 class="div_days_title"> Day ${i+1} </h2>
                    </div>
                `);
                $("#div_content").append(div_day);
            } 
        },

        plan(days, checked) {
            
            for (var i = 0; i < this.data.length; i += 1) {
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
            
            chosen = sorted.slice(0, days*perDay);
            chosen.forEach(function(item, index) {
                item["day"] = Math.floor(index/perDay) + 1;
            });
            
            $("#downloadBtn").css("visibility", "visible");
            $("#saveBtn").css("visibility", "visible");
            $("#div_content").empty();


            ndays = days;
            this.addDays(days);

            for (var i = 0; i < days*perDay; i += 1) {
                let item = chosen[i];          

                let place = $(`
                    <div class="places">
                        <a class="name_places" style="font-weight:bold" href="${item.item.value}" > ${item.itemLabel.value} </a>
                        <p class="description"> ${item.label.value} </p>
                    </div>
                `);

                let index = Math.floor(i/perDay);
                $(`#div_days_${index}`).append(place);
            } 

            trip.content['days'] = ndays;
            trip.content['places'] = chosen;
            trip.content['cityCode'] = cityCode;
            trip.content['cityLabel'] = cityLabel;
        },

        submit() {
            let days = document.getElementById("days").value;
           
            let checked = []
            var checkboxes = document.querySelectorAll('input[type=checkbox]:checked')

            for (var i = 0; i < checkboxes.length; i++) {
                checked.push(checkboxes[i].value)
            }
            
            this.plan(days, checked);
        },
        
        download() {
            let a = document.getElementById("downloadBtn");
            let content = JSON.stringify(trip);
            a.setAttribute('href', "data:application/json," + encodeURIComponent(content));
        },
        
        save() {
            if (!logged) {
                document.getElementById("login_error").innerHTML = "";
                $('#loginModal').modal('toggle');
            }
            else {
                this.saveTrip();
            }
        },

        login() {
            var module = this;
            let username = document.getElementById("username").value.trim();
            let password = document.getElementById("password").value.trim();

            users.forEach(function(item) {
                if (username == item.username && password == item.password) {
                    logged = true;
                    logged_user = username;
                    module.saveTrip();
                    $('#loginModal').modal('toggle');
                }
                else {
                    document.getElementById("login_error").innerHTML = `Wrong username or password`;
                    document.getElementById("username").value = "";
                    document.getElementById("password").value = "";
                }
            });
            
        },
        saveTrip() {
            trip.content['logged_user'] = logged_user;
          
            $.ajax({
                type: "POST",
                url: "/saveTrip",
                data: trip,
                cache: false,
                success: function (data) {
                    alert("Trip plan correctly saved")
                },
                error: function (e) {
                    console.log("error ", e);
                    alert("trip not saved");
                }
            });
        }

    }
}
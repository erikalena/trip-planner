import {users} from '/static/js/config.js';

export default {
    name: 'save',
    template: `
        <div id="div_display" class="container"  >
            <div id="div_content" class="container">
                <p   style="font-weight: 700;"> Here you can see the trip plans you saved. </p>
                
                    <div id="display" class="response"></div>

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
                        <label for="uname"><b>Username</b></label>
                        <input id= "username" type="text" placeholder="Enter Username" name="uname" required>
                
                        <label for="psw"><b>Password</b></label>
                        <input id = "password" type="password" placeholder="Enter Password" name="psw" required>
                        
                        <button type="submit"  @click="login();">Login</button>
                        <a href="/register">Register</a>
                    </div>
                </div>
            </div>
        </div>
        
    `,

    methods: {
        login() {
            var module = this;
            let username = document.getElementById("username").value;
            let password = document.getElementById("password").value;

            users.forEach(function(item) {
                if (username == item.username && password == item.password) {
                    logged = true;
                    logged_user = username;
                    module.showSavedTrip();
                    $('#loginModal').modal('toggle');
                }
                else {
                    document.getElementById("login_error").innerHTML = `Wrong username or password`;
                    document.getElementById("username").value = "";
                    document.getElementById("password").value = "";
                }
            });
            
        },

        showSavedTrip() {
            let module = this;
            $.get( `/visitTables/${logged_user}`, function( data ) {
                if(data.length > 0) {
                    let trip = [];
                    let n = data[0].Trip; // index of first trip for this user
                    let i = 0; // current index
                    let end = 0; // index of last elem of previous trip 
                    while (i < data.length) {
                        if (data[i].Trip == n) {
                            trip[i-end] = data[i];
                            i++;
                        }
                        else {
                            n = data[i+1].Trip;
                            end = i;
                            module.createTable(trip);
                            trip = [];
                        } 
                    }
                    module.createTable(trip);
                }
                else {
                    let p = document.createElement('p');
                    p.innerHTML = "You don't have any saved trip yet.";
                    p.style = "font-weight: 700; color: coral";
                    document.getElementById('display').appendChild(p);

                }
            });

        },

        createTable(data) {
            let db_table = document.createElement('table');
            let header = '';
            Object.keys(data[0]).forEach((key) => {
                header += '<th>' + key + '</th>';
            });
            let tr = document.createElement('tr');
            tr.innerHTML = header;
            let thead = document.createElement('thead');
            thead.appendChild(tr);
            db_table.appendChild(thead)
            let tbody = document.createElement('tbody');
            data.forEach((element) => {
                let tr = document.createElement('tr');
                let row = '';
                Object.keys(element).forEach((key) => {
                    if(!isNaN(Number(element[key]))  && element[key].toString().indexOf('.') != -1) {
                        row += '<td>' +  Number(element[key]).toExponential(3) + '</td>';
                    } else {    
                        row += '<td>' + element[key] + '</td>';
                    }

                });
                tr.innerHTML = row;
                tbody.appendChild(tr);
            });
            db_table.appendChild(tbody);
            document.getElementById('display').appendChild(db_table);
     
        }
    }, 

    mounted() {
        if (logged == false) {
            $('#loginModal').modal('toggle');
        }
        else {
            this.showSavedTrip();
        }
    }
}
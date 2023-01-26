// Define route components

import homeComp from '/static/js/comp_home.js'
import exploreComp from '/static/js/comp_explore.js'
import planComp from '/static/js/comp_plan.js'
import saveComp from '/static/js/comp_save.js'

const Home = homeComp
const Explore = exploreComp
const Plan = planComp
const Save = saveComp



const routes = [
  { path: '/', component: Home },
  { path: '/explore', component: Explore },
  { path: '/plan', component: Plan },
  { path: '/save', component: Save}
]

// Create the router instance 
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes, // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
  if(to.path == '/') {
      $('#stylesheetComp').attr('href', '/static/css/index.css');
  } else {
      $('#stylesheetComp').attr('href','/static/css/explore.css');
  }
  next();
})

// Create and mount the root instance
const app = Vue.createApp({})

app.use(router)

app.mount('#app')


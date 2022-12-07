// Define route components

import homeComp from '/static/js/comp_home.js'
import exploreComp from '/static/js/comp_explore.js'
import planComp from '/static/js/comp_plan.js'

const Home = homeComp
const Explore = exploreComp
const Plan = planComp


const routes = [
  { path: '/', component: Home },
  { path: '/explore', component: Explore },
  { path: '/plan', component: Plan },
]

// Create the router instance 
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes, // short for `routes: routes`
})

// Create and mount the root instance
const app = Vue.createApp({})

app.use(router)

app.mount('#app')


import { createRouter,createWebHashHistory } from "vue-router";
import HomeView from '@/components/HomeView.vue'
import ErrorView from '@/components/ErrorView.vue'
import LoginView from "@/components/LoginView.vue";
import RegisterView from "@/components/RegisterView.vue";

const routes = [
    {
        path:'/',
        redirect:'/login'
    },
    {
        path:'/login',
        component:LoginView
    },
    {
        path:'/register',
        component:RegisterView
    },
    {
        path:'/errors',
        component:ErrorView
    },
    {
        path:'/:pathMatch(.*)*',
        redirect:'/errors'
    }
]

const router = createRouter({
    history:createWebHashHistory(),
    routes
})

export default router
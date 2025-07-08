import { createRouter,createWebHistory } from "vue-router";
import ErrorView from '@/components/ErrorView.vue'
import LoginView from "@/components/LoginView.vue";
import RegisterView from "@/components/RegisterView.vue";
import AdminView from "@/components/AdminView.vue";
import {ElMessage} from "element-plus";

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
        path:'/admin',
        component:AdminView
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
    history:createWebHistory(),
    routes
})

//会递归调用，注意！！！
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');

    if (to.path!== '/admin') {
        next();
    } else if (to.path === '/login') {next()}
    else if (token===null || token==='' || token=== undefined ) {
        alert('请先登陆')
        next('login'); // 继续导航
    }
    else {next()}
});

export default router
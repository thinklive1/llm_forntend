import '@/assets/main.css'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createApp} from "vue";
import App from "@/App.vue";
import axios from "axios";
import {createPinia} from "pinia";

const pinia = createPinia();
axios.defaults.baseURL = 'http://localhost:8080'

const app = createApp(App)
app.use(router) //注册路由
    .use(ElementPlus)
    .use(pinia);

app.mount('#app')


import '@/assets/main.css'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createApp} from "vue";
import App from "@/App.vue";
import axios from "axios";

axios.defaults.baseURL = 'http://127.0.0.1:8080'

const app = createApp(App)
app.use(router) //注册路由
    .use(ElementPlus)

app.mount('#app')


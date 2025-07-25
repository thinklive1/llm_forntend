import axios from "axios";
import {ElMessage} from "element-plus";
import router from "@/router";

const authItemName = "token"
const req_cd = 3;//操作的最小间隔

const error_report = ({res}) => {
    if (typeof(res)==="undefined") {
        console.log("未知错误，请查看控制台报错");
        ElMessage("未知错误，请查看控制台信息");
    }
    else {
        console.log(res.message);
        ElMessage(res.message);
    }
}

function takeAccessToken() {
    const str = localStorage.getItem('token');
    if(typeof(str)==="undefined" || str === null) {
        //ElMessage('no token found');
        return null
    }
    return str
}

function storeAccessToken(remember, token, expire){
    const authObj = {
        token: token,
        expire: expire
    }
    const str = JSON.stringify(authObj)
    if(remember)
        localStorage.setItem(authItemName, str)
    else
        sessionStorage.setItem(authItemName, str)
}

function deleteAccessToken(redirect = true) {
    localStorage.removeItem(authItemName)
    sessionStorage.removeItem(authItemName)
    if(redirect) {
        router.push('/login')
    }
}

function logout(){
        deleteAccessToken()
        ElMessage.success(`退出登录成功，欢迎您再次使用`)
}

const cooldown = (time) => {
    time.value=req_cd;
    const handler = setInterval(() => {
        console.log('start interval');
        time.value--
        if (time.value === 0) {
            clearInterval(handler)
        }
    }, 1000)
}

export {  error_report, logout, takeAccessToken,cooldown}

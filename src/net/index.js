import axios from "axios";
import {ElMessage} from "element-plus";
import router from "@/router/index.js";


const authItemName = "authorize"

const accessHeader = () => {
    return {
        'Authorization': `Bearer ${takeAccessToken()}`
    }
}

const defaultError = (error) => {
    console.error(error)
    const status = error.response.status
    if (status === 429) {
        ElMessage.error(error.response.data.message)
    } else {
        ElMessage.error('发生了一些错误，请联系管理员')
    }
}

const defaultFailure = (message, status, url) => {
    console.warn(`请求地址: ${url}, 状态码: ${status}, 错误信息: ${message}`)
    ElMessage.warning(message)
}

function login(username, password, success, failure = defaultFailure){
    internalPost('/v1/auth/login', {
        username: username,
        password: password
    }, {
        'Content-Type': 'application/json'
    }, (data) => {
        storeAccessToken(data.token)
        ElMessage.success(`登录成功，欢迎你 ${data.username} `)
        success(data)
    }, failure)
}


function internalPost(url, data, headers, success, failure, error = defaultError){
    axios.post(url, data, { headers: headers }).then(({data}) => {
        if(data.code === 200) {
            success(data.data)
        } else if(data.code === 401) {
            failure('登录状态已过期，请重新登录！')
        } else {
            failure(data.message, data.code, url)
        }
    }).catch(err => error(err))
}



function post(url, data, success, failure = defaultFailure, error = defaultError) {
    axios.post(url, data, {
        withCredentials: true,headers: {
            'Content-Type': 'application/json'
        }
    }).then(({data}) => {
        if(data.code===200)
            success(data.message, data.code)
        else
            failure(data.message, data.code)
    }).catch(error)
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

function get(url, success, failure = defaultFailure, error = defaultError) {
    axios.get(url, {
        withCredentials: true
    }).then(({data}) => {
        if(data.code===200)
            success(data.message, data.code)
        else
            failure(data.message, data.code)
    }).catch(error)
}

export { post, get, login }

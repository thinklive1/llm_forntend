<script setup >


import {reactive, ref} from "vue";
import {ElMessage} from "element-plus";
import axios from "axios";
import router from "@/router/index.js";
import { auth } from '@/stores/index.js'
import {login, post} from '@/net/index.js'

const formRef = ref()
const form = reactive({
  username: '',
  password: '',
});


const rules = {
  username: [
    { min: 2, max: 8, message: '用户名的长度必须在2-8个字符之间', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 16, message: '密码的长度必须在6-16个字符之间', trigger: ['blur', 'change'] }
  ],

}

const login1 = () => {
  formRef.value.validate((isValid) => {
    if(isValid) {
      axios.post('/v1/auth/login', {
        username: form.username,
        password: form.password,
      },{headers: {
        'Content-Type': 'application/json' // 设置请求头
      },
      withCredentials: true // 如果需要发送 cookie
    }).then(({data}) => {
        if (data.code===200) {
          ElMessage('login success token:' + data.data.token )
          auth.username = data.data.username
          localStorage.setItem('token', data.data.token);
          router.push('/admin')}
        }).catch(error => { ElMessage(error.response.data.message) })
    }
    else {
      ElMessage.warning('请完整填写注册表单内容！')
    }
  })
}


function userLogin() {
  ElMessage('username:'+form.username+"pd:"+form.password)
  formRef.value.validate((isValid) => {
    if(isValid) {
      ElMessage('start login')
      login(form.username, form.password, () => router.push("/index"))
    }
  });
}

</script>

<template>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理员登录</title>
  </head>

  <body class="bg-gray-100 flex items-center justify-center min-h-screen">
  <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
    <div>
      <h1 class="text-center text-2xl font-bold text-gray-800">大模型代理服务</h1>
      <h2 class="mt-2 text-center text-lg font-semibold text-gray-700">管理员注册</h2>
      <p class="mt-1 text-center text-sm text-gray-500">欢迎回来，请输入您的凭证</p>
    </div>
  <div style="margin-top: 50px">
    <el-form :model="form" :rules="rules" ref="formRef">
      <el-form-item prop="username">
        <label for="email" class="block text-sm font-medium text-gray-700">用户名</label>
        <el-input v-model="form.username" :maxlength="8" type="text" placeholder="用户名">
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <label for="email" class="block text-sm font-medium text-gray-700">密码</label>
        <el-input v-model="form.password" :maxlength="16" type="password" placeholder="密码">
        </el-input>
      </el-form-item>

  <div style="margin-top: 20px;display: flex; flex-direction: column; align-items: center;">
    <el-button type="primary" style="width: 270px" @click="login1" plain>登陆</el-button>
  </div>
  <div style="margin-top: 20px;display: flex; justify-content: center; flex-direction: row; align-items: center;">
    <span style="font-size: 14px;line-height: 15px;color: grey">没有账号? </span>
    <el-link type="primary" style="translate: 0 -2px" @click="router.push('/register')">立即注册</el-link>
  </div>
  </el-form>
  </div>
  </div>
  </body>

</template>

<style scoped>
@import "tailwindcss";

</style>
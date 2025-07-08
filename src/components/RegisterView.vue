<script setup>

import {reactive, ref} from "vue";
import {cooldown, error_report, post} from "@/net/index.js";
import router from "@/router/index.js";
import {ElMessage} from "element-plus";
import axios from "axios";
import {auth} from "@/stores/index.js";

const validateUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if(!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(value)){
    callback(new Error('用户名不能包含特殊字符，只能是中文/英文'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const form = reactive({
  username: '',
  password: '',
  password_repeat: '',
  email: '',
})

const rules = {
  username: [
    { validator: validateUsername, trigger: ['blur', 'change'] },
    { min: 2, max: 8, message: '用户名的长度必须在2-8个字符之间', trigger: ['blur', 'change'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 16, message: '密码的长度必须在6-16个字符之间', trigger: ['blur', 'change'] }
  ],
  password_repeat: [
    { validator: validatePassword, trigger: ['blur', 'change'] },
  ],
  email: [
    { required: true, message: '请输入邮件地址', trigger: 'blur' },
    {type: 'email', message: '请输入合法的电子邮件地址', trigger: ['blur', 'change']}
  ],
}


let last_req_time = ref(0);
const formRef = ref()

const register = () => {
  formRef.value.validate((isValid) => {
    if(isValid) {
      if (last_req_time.value === 0) {
      //cooldown(last_req_time);//设置请求cd，开发阶段默认不启用，先注释掉
      axios.post('/v1/auth/register', {
        username: form.username,
        password: form.password,
        email: form.email,
      }, {headers: {
          'Content-Type': 'application/json', // 设置请求头
        },
        withCredentials: true // 如果需要发送 cookie
      }).then(({data}) => {
            if (data.code===200) {
              ElMessage('注册成功，跳转到登陆页面');
              router.push('/login')}
            else error_report(data)
          }
      ).catch(error => { ElMessage(error.response.data.message) })
    }
      else ElMessage.warning('操作过于频繁，请'+last_req_time.value+'秒后继续操作')
    }
    else {
      ElMessage.warning('请完整填写注册表单内容！')
    }
  })
}
</script>

<template>

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理员注册</title>
  </head>
  <body class="bg-gray-100 flex items-center justify-center min-h-screen">
  <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
    <div>
      <h1 class="text-center text-2xl font-bold text-gray-800">大模型代理服务</h1>
      <h2 class="mt-2 text-center text-lg font-semibold text-gray-700">管理员注册</h2>
      <p class="mt-1 text-center text-sm text-gray-500">请根据邮箱地址进行注册</p>
    </div>
    <div style="margin-top: 50px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <label for="email" class="block text-sm font-medium text-gray-700">用户名</label>
          <el-input v-model="form.username" :maxlength="50" type="text" placeholder="用户名">
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <label for="email" class="block text-sm font-medium text-gray-700">密码</label>
          <el-input v-model="form.password" :maxlength="16" type="password" placeholder="密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="password_repeat">
          <label for="email" class="block text-sm font-medium text-gray-700">重复密码</label>
          <el-input v-model="form.password_repeat" :maxlength="16" type="password" placeholder="重复密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="email">
          <label for="email" class="block text-sm font-medium text-gray-700">邮箱</label>
          <el-input v-model="form.email" placeholder="电子邮件地址"> </el-input>
        </el-form-item>
      </el-form>
    </div>
    <div style="margin-top: 80px;display: flex; flex-direction: column; align-items: center;">
      <el-button style="width: 270px" type="primary" @click="register" plain>注册</el-button>
    </div>
    <div style="margin-top: 20px;display: flex; justify-content: center; flex-direction: row; align-items: center;">
      <span style="font-size: 14px;line-height: 15px;color: grey">已有账号? </span>
      <el-link type="primary" style="translate: 0 -2px" @click="router.push('/login')">立即登录</el-link>
    </div>
  </div>
  </body>

</template>

<style scoped>

@import "tailwindcss";

</style>
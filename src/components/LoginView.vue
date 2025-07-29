<script setup lang="ts">


import {reactive, ref} from "vue";
import {ElMessage, FormInstance, FormRules} from "element-plus";
import axios from "axios";
import router from "@/router/index.js";
import { states } from '@/stores/index.js'
import {cooldown, error_report, } from '@/net/index.js'

const token = localStorage.getItem('token');
if (token!==null && token!=='' && token!== undefined ) {
  ElMessage('您已登陆，跳转至管理界面')
  router.push('/admin')
}

interface RuleForm {
  username: string
  password: string
}
const ruleFormRef = ref<FormInstance>()
const form = reactive<RuleForm>({
  username: '',
  password: '',
});

let last_req_time = ref(0);

const rules = reactive<FormRules<RuleForm>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度需要在2-20字符间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },]
})

const login1 = (formRef: FormInstance) => {
  formRef.validate((isValid) => {
    if(isValid) {
      if (last_req_time.value === 0) {
        cooldown(last_req_time);//设置请求cd，开发阶段默认不启用，先注释掉
        axios.post('/v1/auth/login', {
          username: form.username,
          password: form.password,
        }, {
          headers: {
            'Content-Type': 'application/json', // 设置请求头
            'Authorization': undefined,
          },
          withCredentials: true // 如果需要发送 cookie
        }).then(({data}) => {
              if (data.code === 200) {
                ElMessage.success('登陆成功，跳转至管理界面')
                localStorage.setItem('token', data.data.token);
                sessionStorage.setItem('username', form.username);
                router.push('/admin')
              } else error_report(data)
            }
        )
      .catch(error => {
        if (error.response.status === 400) { ElMessage('用户名或密码错误')}
        else error_report(error) })
      }
      else {
        ElMessage.warning('操作过于频繁，请'+last_req_time.value+'秒后继续操作')
      }}
    else {
      ElMessage.warning('请完整填写登陆表单内容！')
    }
  })
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
      <h2 class="mt-2 text-center text-lg font-semibold text-gray-700">管理员登陆</h2>
      <p class="mt-1 text-center text-sm text-gray-500">欢迎回来，请输入您的凭证</p>
    </div>
    <div style="margin-top: 50px">
      <el-form :model="form" :rules="rules" ref="ruleFormRef">
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
          <el-button type="primary" style="width: 270px" @click="login1(ruleFormRef)" plain>登陆</el-button>
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
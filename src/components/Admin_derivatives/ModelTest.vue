<script setup lang="ts">

import {ref} from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";
import {ElMessage} from "element-plus";

interface Message {
  role: string;
  content: string;
}

interface Options {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
}

interface Image {
  url: string;
}

interface RequestData {
  userMessage: string;
  modelIdentifier: string;
  history?: Message[];
  options?: Options;
  images?: Image[];
}

interface textResponse {
  "assistantMessage": string;
  "usedModelIdentifier": string;
}


//以下是开关变量
const isChatOpen = ref(false);//控制文字窗口开闭
const waitRep = ref<boolean>(false);//是否收到模型回应，控制等待模型回答时的进度条开闭
const isResGet = ref<boolean>(false);//是否显示模型回应

//数据区
const req = ref<RequestData>({//发给模型的请求
  userMessage: '',
  modelIdentifier: '',
});
const keyInUse = ref<string>();//当前使用的accessKey
const emit = defineEmits();
const M2Test = ref()//用于测试的模型信息
const mes = ref<string>('')//用户输入发给模型的信息
const resData = ref<textResponse>();


const testEntry= (key: string,ModelToTest) => {//整个组件的入口，将管理组件传来的key和模型信息存储下来，然后进行之后的测试
  keyInUse.value=key;
  M2Test.value=ModelToTest;
  let caps: Array<string> =ModelToTest.capabilities;
  caps.forEach((c: string)=> {
    switch (c) {
      case 'text-to-text':
        console.log('开始进行t2t模型测试')
        testT2T(ModelToTest);
        break;
      default:
        console.log('遇到了没有登记的类型：' + c)
        break;
    }
  })
}

const send_chat =(m) => {
  req.value.userMessage=mes.value;
  req.value.modelIdentifier=m.modelIdentifier;
  waitRep.value=true;
  axios.post('/v1/chat', req.value,{headers: {
      'Content-Type': 'application/json',
      'ACCESS-KEY': keyInUse.value,
      'Authorization': `Bearer ${takeAccessToken()}`
},
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      waitRep.value=false;
      resData.value=data.data;
      isResGet.value=true;
      //ElMessage('get_model success. modelid is '+data.data.id);
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const testT2T = (m) => {
  isChatOpen.value = true;
}

const closetestText = () => {
  isChatOpen.value = false;
}

const waiting = ()=> {
  return '等待模型回应'
}


defineExpose({testEntry})
</script>

<template>

  <div v-if="isChatOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="modal-content w-1/2 bg-white rounded-lg shadow-xl mx-4 p-6 relative max-h-120 overflow-scroll">
      <el-container direction="vertical">
        <div v-if="isResGet" class="flex justify-end items-center">
          <div class="m-4 rounded-lg shadow-lg p-6 w-80 ml-4 flex flex-col shadow-lg" style="margin: 5px">
            <p class="mb-4">{{mes}}</p>
          </div>
          <div class="bg-gray-200 hover:text-black flex items-center justify-center w-15 h-15 font-bold shadow-lg">
            用户
          </div>
        </div>
        <div v-if="isResGet" class="flex items-center">
          <div class="bg-gray-200 hover:text-black flex items-center justify-center h-15 font-bold shadow-lg">
            {{resData.usedModelIdentifier}}
          </div>
          <div class="m-4 bg-blue-100 bg-white rounded-lg shadow-lg p-6 max-w-3/4 ml-4 flex flex-col" style="margin: 5px">
            <p class="mb-4">{{resData.assistantMessage}}</p>
          </div>
        </div>
        <div v-if="!isResGet" class="flex justify-end">
          <el-card class=" text-center" shadow="always">
            <el-container direction="horizontal">
             <el-input placeholder="输入测试信息" v-model="mes"></el-input>
              <el-button type="primary" @click="send_chat(M2Test)" >发送</el-button>
            </el-container>
          </el-card>
        </div>
        <el-container v-if="waitRep" class="w-1/2" direction="vertical">
        <el-progress :percentage="50" :format="waiting" :indeterminate="true" ></el-progress>
        </el-container>
      </el-container>
    </div>
  </div>


</template>

<style scoped>
@import "tailwindcss";

</style>

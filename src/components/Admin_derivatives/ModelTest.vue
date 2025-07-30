<script setup lang="ts">

import {ref, } from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";
import {ElMessage, FormInstance, FormRules} from "element-plus";
import {states} from "@/stores"

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


interface DIA {
  "role": string;
  "content": string;
}
interface ImageURL {
  url: string;
}

interface OPTIONDATA {
  images: ImageURL[];
  "history": DIA[]
  "temperature": number;
  "max_tokens": number;
  "top_p": number;
  "frequency_penalty": number;
}


//以下是开关变量
const isChatOpen = ref(false);//控制文字窗口开闭
const waitRep = ref<boolean>(false);//是否收到模型回应，控制等待模型回答时的进度条开闭
const isResGet = ref<boolean>(false);//是否显示模型回应
const isUsingOptionData = ref<boolean>(false);

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
const inputDia= ref<DIA[]>(
    [{role: "user", content: "你好"}, {role: "assistant", content: "你好，有什么可以帮你的吗？"}]
)
const opData = ref<OPTIONDATA>({
      images: [],
      history: inputDia.value,
      temperature: 0.7,
      max_tokens: 512,
      top_p: 0.9,
      frequency_penalty: 0.0,
    }
)
const ImageToSend = ref<ImageURL>({
  url: ''
});
const ruleFormRef = ref<ImageURL>()

//特殊数据
const buttonRef = ref()
const popoverRef = ref()
const rules = {
  url: [
    { required: true, message: '请输入图片url', trigger: ['blur', 'change'] },
    { pattern: '(http|https)://[\\w\\d./?&=#+-]+\\.(jpg|jpeg|png)', message: '必须是图片格式', trigger: ['blur', 'change'] },
  ],
}

const testEntry= () => {//整个组件的入口，将管理组件传来的key和模型信息存储下来，然后进行之后的测试
  keyInUse.value=states.KeyInUse;
  M2Test.value=states.ModelToTest;
  switch (states.CapInTest) {
    case 'text-to-text':
      console.log('开始进行t2t模型测试')
      testT2T();
      break;
    case 'text-to-image':
      console.log('开始进行t2i模型测试')
      testT2M();
      break;
    case 'image-to-text':
      console.log('开始进行i2t模型测试')
      testM2T();
      break;
    default:
      ElMessage.warning('遇到了没有注册的类型:'+states.CapInTest)
      break;
  }
}

const send_chat =(m) => {
  req.value.userMessage=mes.value;
  req.value.modelIdentifier=m.modelIdentifier;
  waitRep.value=true;
  console.log(req);
  if (isUsingOptionData.value){
    req.value = {...req.value,...opData.value}
  }
  timeoutAlert()
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

const send_chatWithImg = (formRef: FormInstance) => {
  formRef.validate((isValid) => {
    if (isValid) {
      req.value.images=[ImageToSend.value];
      send_chat(states.ModelToTest)
    }
  })

}

const testT2T = () => {
  isChatOpen.value = true;
}

const testM2T = () => {
  isChatOpen.value = true;
}

const testT2M = () => {
  isChatOpen.value = true;
}

const closetestText = () => {
  isChatOpen.value = false;
}

const waiting = ()=> {
  return '等待模型回应'
}

const cancel_change = () => {
  isUsingOptionData.value=false;
  popoverRef.value.hide();
}

const save_change = () => {
  isUsingOptionData.value=true;
  popoverRef.value.hide();
}

const timeoutAlert = ()=> {
  setTimeout(() => {
    if(waitRep.value) alert('模型30秒内未响应，可能出现问题')
  }, 30000);
}

const close_test = () => {
  states.CapInTest = '';
  states.ModelToTest = undefined;
  isChatOpen.value = false;
}

const reset_test = () => {
  waitRep.value=false;
  isResGet.value=false;
  isUsingOptionData.value=false;
}

defineExpose({testEntry})
</script>

<template>

  <div v-if="isChatOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="modal-content w-1/2 bg-white rounded-lg shadow-xl mx-4 p-6 relative max-h-120 overflow-scroll">
      <el-container class="m-4" direction="vertical">
        <div v-if="isResGet" class=" flex justify-end items-center">
          <div class="m-4 rounded-lg shadow-lg p-6 w-80 ml-4 flex flex-col shadow-lg" style="margin: 5px">
            <p class="mb-4">{{mes}}</p>
          </div>
          <div class="bg-gray-200 hover:text-black flex items-center justify-center w-15 h-15 font-bold shadow-lg">
            用户
          </div>
        </div>
        <div class="flex justify-end">
        <el-image class="max-w-1/3" v-if="isResGet && states.CapInTest==='image-to-text'" :src="ImageToSend.url"></el-image>
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
          <el-card class=" text-center w-1/3" shadow="always">
            <el-container class="m-auto flex justify-end w-full" direction="vertical">
              <el-input type="textarea" autosize clearable placeholder="输入测试信息" v-model="mes"></el-input>
              <el-form :rules="rules" :model="ImageToSend" ref="ruleFormRef">
                <el-form-item prop="url">
                  <el-input :maxlength="512" v-if="states.CapInTest==='image-to-text'" placeholder="输入图片url" v-model="ImageToSend.url"></el-input>
                </el-form-item>
              </el-form>
              <el-row class="flex justify-center">
                <el-popover class="w-3/4" placement="bottom" title="若不保存更改则不发送任何可选参数!" :width="400" trigger="click" ref="popoverRef">
                  <template #reference>
                    <el-button class="m-2">更多自定义选项</el-button>
                  </template>
                  <el-form :model="opData">
                    <div class="grid grid-cols-1 gap-4 mb-4 ">
                      <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">历史信息</label>
                        <el-form-item prop="history">
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1</label>
                            <el-input clearable type="text" size="small" :maxlength="255" :minlength="2" v-model="opData.history[0].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1输入</label>
                            <el-input clearable type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="opData.history[0].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2</label>
                            <el-input clearable type="text" size="small" :maxlength="255" :minlength="2" v-model="opData.history[1].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2输入</label>
                            <el-input clearable type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="opData.history[1].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                        </el-form-item>
                        <el-divider />
                      </div>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mb-4 ">
                      <div class="mb-4">
                        <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-1">temperature</label>
                        <el-form-item prop="temperature">
                          <el-input-number v-model="opData.temperature" :max="1.0" :min="0.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="max_tokens" class="block text-sm font-medium text-gray-700 mb-1">max tokens:</label>
                        <el-form-item prop="max_tokens">
                          <el-input-number v-model="opData.max_tokens" :max="65536" :step="10" :min="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="max_tokens" class="block text-sm font-medium text-gray-700 mb-1">top_p:</label>
                        <el-form-item prop="top_p">
                          <el-input-number v-model="opData.top_p" :max="1.0" :min="0.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="max_tokens" class="block text-sm font-medium text-gray-700 mb-1">频率惩罚:</label>
                        <el-form-item prop="frequency_penalty">
                          <el-input-number v-model="opData.frequency_penalty" :max="1.0" :min="0.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                    </div>
                  </el-form>
                  <div class="flex justify-center">
                    <el-button ref="buttonRef" @click="cancel_change">取消更改</el-button>
                    <el-button type="primary" @click="save_change">保存更改</el-button>
                  </div>
                </el-popover>
                <el-button v-if="states.CapInTest==='image-to-text'" class="h-full w-1/4 " type="primary" @click="send_chatWithImg(ruleFormRef)" >发送</el-button>
                <el-button v-if="states.CapInTest==='text-to-text'" class="h-full w-1/4 " type="primary" @click="send_chat(M2Test)" >发送</el-button>
              </el-row>
            </el-container>
          </el-card>
        </div>
        <el-container v-if="waitRep" class="w-1/2" direction="vertical">
          <el-progress :percentage="50" :format="waiting" :indeterminate="true" ></el-progress>
        </el-container>
      </el-container>
      <div class="flex justify-center mt-auto ">
        <el-button @click="close_test" type="info" >退出测试</el-button>
        <el-button @click="reset_test" type="primary" >重置测试</el-button>
      </div>
    </div>
  </div>


</template>

<style scoped>
@import "tailwindcss";

</style>

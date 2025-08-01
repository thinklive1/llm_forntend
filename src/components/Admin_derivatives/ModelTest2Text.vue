<script setup lang="ts">

import {ref, } from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";
import {ElMessage, FormInstance, FormRules} from "element-plus";
import {states} from "@/stores"

console.log('init text test')

// ts接口,接口命名格式为Format开头的驼峰命名
interface FormatMessage {
  role: string;
  content: string;
}

interface FormatOptionDatas {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
}

interface FormatImage {
  url: string;
}

interface FormatRequestData {
  userMessage: string;
  modelIdentifier?: string;
  modelInternalId?: number;
  history?: FormatMessage[];
  options?: FormatOptionDatas;
  images?: FormatImage[];
}

interface FormatResponseData {
  assistantMessage: string;
  usedModelIdentifier: string;
}

interface FormatImageInput {
  url?: string;
  base64?: string;
}

interface FormatOptionData {
  images: FormatImageInput[];
  history: FormatMessage[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
}

//开关变量,均以is开头，驼峰命名
const isChatOpen = ref(false);//控制聊天窗口开闭
const isWaitRep = ref<boolean>(false);//是否收到模型回应，控制等待模型回答时的进度条开闭
const isResGet = ref<boolean>(false);//是否显示模型回应
const isUsingOptionData = ref<boolean>(false);//是否使用可选参数

//响应式变量,使用蛇形命名,Ref后缀,表示均为ref声明的响应式数据
const reqRef = ref<FormatRequestData>({//发给模型的请求
  userMessage: '',
  modelIdentifier: '',
});
const mesRef = ref<string>('')//用户输入发给模型的信息
const response_dataRef = ref<FormatResponseData>();
const input_dialogRef= ref<FormatMessage[]>(
    [{role: "user", content: "你好"}, {role: "assistant", content: "你好，有什么可以帮你的吗？"}]
)
const option_dataRef = ref<FormatOptionData>({
      images: [],
      history: input_dialogRef.value,
      temperature: 0.7,
      max_tokens: 512,
      top_p: 0.9,
      frequency_penalty: 0.0,
    }
)
const image_url_to_sendRef = ref<FormatImageInput>({
  url: ''
});

//特殊数据
const rule_formRef = ref<FormInstance>()//用于rul校验
const buttonRef = ref()
const popoverRef = ref()
const rules = {
  url: [
    { required: true, message: '请输入图片url', trigger: ['blur', 'change'] },
    { pattern: '(http|https)://[\\w\\d./?&=#+-]+\\.(jpg|jpeg|png)', message: '必须是图片格式', trigger: ['blur', 'change'] },
  ],
}

const waiting = ()=> {
  return '等待模型回应'
}
const timeoutAlert = ()=> {
  setTimeout(() => {
    if(isWaitRep.value) alert('模型30秒内未响应，可能出现问题')
  }, 30000);
}

//函数,蛇形命名,需要以常见的操作名开头
const test_entry= () => {//整个组件的入口，将管理组件传来的key和模型信息存储下来，然后进行之后的测试
  switch (states.CapInTest) {
    case 'text-to-text':
      console.log('开始进行t2t模型测试')
      isChatOpen.value = true;
      break;
    case 'image-to-text':
      console.log('开始进行i2t模型测试')
      isChatOpen.value = true;
      break;
    default:
      ElMessage.warning('遇到了没有注册的类型:'+states.CapInTest)
      break;
  }
}

const send_chat =() => {
  reqRef.value.userMessage=mesRef.value;
  reqRef.value.modelIdentifier=states.ModelToTest.modelIdentifier;
  isWaitRep.value=true;
  console.log(reqRef);
  if (isUsingOptionData.value){
    reqRef.value = {...reqRef.value,...option_dataRef.value}
  }
  timeoutAlert()
  axios.post('/v1/chat', reqRef.value,{headers: {
      'Content-Type': 'application/json',
      'ACCESS-KEY': states.KeyInUse,
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      isWaitRep.value=false;
      response_dataRef.value=data.data;
      isResGet.value=true;
    }
    else ElMessage(data.message)
  }).catch(error => {error_report(error) })
}

const send_chat_with_img = (formRef: FormInstance) => {
  formRef.validate((isValid) => {
    if (isValid) {
      reqRef.value.images=[image_url_to_sendRef.value];
      send_chat()
    }
  })
}

const cancel_change = () => {
  isUsingOptionData.value=false;
  popoverRef.value.hide();
}

const save_change = () => {
  isUsingOptionData.value=true;
  popoverRef.value.hide();
}

const close_test = () => {
  reset_test()
  states.CapInTest = '';
  states.ModelToTest = undefined;
  isChatOpen.value = false;
}

const reset_test = () => {
  isWaitRep.value=false;
  isResGet.value=false;
  isUsingOptionData.value=false;
}

defineExpose({test_entry})
</script>

<template>

  <div v-if="isChatOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="modal-content w-1/2 bg-white rounded-lg shadow-xl mx-4 p-6 relative max-h-120 overflow-scroll">
      <el-container class="m-4" direction="vertical">
        <div v-if="isResGet" class=" flex justify-end items-center">
          <div class="m-4 rounded-lg shadow-lg p-6 w-80 ml-4 flex flex-col shadow-lg" style="margin: 5px">
            <p class="mb-4">{{ mesRef }}</p>
          </div>
          <div class="bg-gray-200 hover:text-black flex items-center justify-center w-15 h-15 font-bold shadow-lg">
            用户
          </div>
        </div>
        <div class="flex justify-end">
          <el-image class="max-w-1/3" v-if="isResGet && states.CapInTest==='image-to-text'" :src="image_url_to_sendRef.url"></el-image>
        </div>
        <div v-if="isResGet" class="flex items-center">
          <div class="bg-gray-200 hover:text-black flex items-center justify-center h-15 font-bold shadow-lg">
            {{ response_dataRef.usedModelIdentifier }}
          </div>
          <div class="m-4 bg-blue-100 bg-white rounded-lg shadow-lg p-6 max-w-3/4 ml-4 flex flex-col" style="margin: 5px">
            <p class="mb-4">{{ response_dataRef.assistantMessage }}</p>
          </div>
        </div>
        <div v-if="!isResGet" class="flex justify-end">
          <el-card class=" text-center w-1/3" shadow="always">
            <el-container class="m-auto flex justify-end w-full" direction="vertical">
              <el-input type="textarea" autosize clearable placeholder="输入测试信息" v-model="mesRef"></el-input>
              <el-form :rules="rules" :model="image_url_to_sendRef" ref="rule_formRef">
                <el-form-item prop="url">
                  <el-input :maxlength="512" v-if="states.CapInTest==='image-to-text'" placeholder="输入图片url" v-model="image_url_to_sendRef.url"></el-input>
                </el-form-item>
              </el-form>
              <el-row class="flex justify-center">
                <el-popover class="w-3/4" placement="bottom" title="若不保存更改则不发送任何可选参数!" :width="400" trigger="click" ref="popoverRef">
                  <template #reference>
                    <el-button class="m-2">更多自定义选项</el-button>
                  </template>
                  <el-form :model="option_dataRef">
                    <div class="grid grid-cols-1 gap-4 mb-4 ">
                      <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">历史信息</label>
                        <el-form-item prop="history">
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1</label>
                            <el-input clearable type="text" size="small" :maxlength="255" :minlength="2" v-model="option_dataRef.history[0].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1输入</label>
                            <el-input clearable type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="option_dataRef.history[0].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2</label>
                            <el-input clearable type="text" size="small" :maxlength="255" :minlength="2" v-model="option_dataRef.history[1].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2输入</label>
                            <el-input clearable type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="option_dataRef.history[1].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                        </el-form-item>
                        <el-divider />
                      </div>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mb-4 ">
                      <div class="mb-4">
                        <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-1">temperature</label>
                        <el-form-item prop="temperature">
                          <el-input-number v-model="option_dataRef.temperature" :max="1.0" :min="0.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="max_tokens" class="block text-sm font-medium text-gray-700 mb-1">max tokens:</label>
                        <el-form-item prop="max_tokens">
                          <el-input-number v-model="option_dataRef.max_tokens" :max="65536" :step="10" :min="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="top_p" class="block text-sm font-medium text-gray-700 mb-1">top_p:</label>
                        <el-form-item prop="top_p">
                          <el-input-number v-model="option_dataRef.top_p" :max="1.0" :min="0.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                      <div class="mb-4">
                        <label for="fre_pena" class="block text-sm font-medium text-gray-700 mb-1">频率惩罚:</label>
                        <el-form-item prop="frequency_penalty">
                          <el-input-number v-model="option_dataRef.frequency_penalty" :max="2.0" :min="-2.0" :step="0.1" :precision="1" style="width: 100%;" controls-position="right" size="small" />
                        </el-form-item>
                      </div>
                    </div>
                  </el-form>
                  <div class="flex justify-center">
                    <el-button ref="buttonRef" @click="cancel_change">取消更改</el-button>
                    <el-button type="primary" @click="save_change">保存更改</el-button>
                  </div>
                </el-popover>
                <el-button v-if="states.CapInTest==='image-to-text'" class="h-full w-1/4 " type="primary" @click="send_chat_with_img(rule_formRef)" >发送</el-button>
                <el-button v-if="states.CapInTest==='text-to-text'" class="h-full w-1/4 " type="primary" @click="send_chat" >发送</el-button>
              </el-row>
            </el-container>
          </el-card>
        </div>
        <el-container v-if="isWaitRep" class="w-1/2" direction="vertical">
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

<script setup lang="ts">

import {ref, } from "vue";
import axios from "axios";
import {error_report, } from "@/net/index.js";
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
const request_dataRef = ref<FormatRequestData>({//发给模型的请求
  userMessage: '',
  modelIdentifier: '',
});
const response_dataRef = ref<FormatResponseData>();//收到的回应
const option_dataRef = ref<FormatOptionData>({//可选字段
      temperature: 0.7,
      max_tokens: 512,
      top_p: 0.9,
      frequency_penalty: 0.0,
    }
)
const history_dataRef = ref<FormatMessage[]>([{role: "user", content: "你好"}, {role: "assistant", content: "你好，有什么可以帮你的吗？"}]);
const image_to_sendRef = ref<FormatImageInput>({//输入图片字段，图生图专用
  url: ''
});

//特殊数据
const rule_formRef1 = ref<FormInstance>()//用于rul校验
const buttonRef = ref()
const popoverRef = ref()
const rules = {
  url: [
    { required: true, message: '请输入图片url', trigger: ['blur', 'change'] },
    { pattern: '(http|https)://[\\w\\d./?&=#+-]+\\.(jpg|jpeg|png)', message: '必须是图片格式', trigger: ['blur', 'change'] },
  ],
  temperature: [
    { required: true, message: '请输入temperature', trigger: 'blur' },
    {type: 'number', message: '请输入0-1的数值', trigger: ['blur', 'change']}
  ],
  max_tokens: [
    { required: true, message: '请输入max_token', trigger: 'blur' },
    {type: 'number', message: '请输入0-1的数值', trigger: ['blur', 'change']}
  ],
  top_p: [
    { required: true, message: '请输入top_p', trigger: 'blur' },
    {type: 'number', message: '请输入0-1的数值', trigger: ['blur', 'change']}
  ],
  frequency_penalty: [
    { required: true, message: '请输入frequency_penalty', trigger: 'blur' },
    {type: 'number', message: '请输入-2~2的数值', trigger: ['blur', 'change']}
  ],
}

const waiting = ()=> {
  return '等待模型回应'
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
  if (request_dataRef.value.userMessage==='') {ElMessage.warning('用户消息不能为空');return;}
  request_dataRef.value.modelIdentifier=states.ModelToTest.modelIdentifier;
  if (isUsingOptionData.value){
    request_dataRef.value.options = option_dataRef.value;
    request_dataRef.value.history = history_dataRef.value;
  }
  if (states.CapInTest==='text-to-text') { delete request_dataRef.value.images; }
  isWaitRep.value=true;
  const timeoutAlert = setTimeout(() => {
    if(isWaitRep.value) alert('模型30秒内未响应，可能出现问题')
  }, 30000);
  axios.post('/v1/chat', request_dataRef.value,{headers: {
      'Content-Type': 'application/json',
      'ACCESS-KEY': states.KeyInUse,
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      isWaitRep.value=false;
      clearTimeout(timeoutAlert);
      console.log('stop timeout alert')
      response_dataRef.value=data.data;
      isResGet.value=true;
    }
    else {ElMessage(data.message); clearTimeout(timeoutAlert);}
  }).catch(error => {
    error_report(error);
    reset_test();
    clearTimeout(timeoutAlert);
  })
}

const send_chat_with_img = (formRef: FormInstance) => {
  formRef.validate((isValid) => {
    if (isValid) {
      request_dataRef.value.images=[image_to_sendRef.value];
      send_chat()
    } else  ElMessage.warning('请完整填写表单')
  })
}

const cancel_change = () => {
  reset_test()
  popoverRef.value.hide();
}

const save_change = (formRef: FormInstance) => {
  formRef.validate((isvalid)=> {
    if (isvalid) {
      isUsingOptionData.value = true;
      popoverRef.value.hide();
    } else ElMessage.warning('请完整填写表单')
  })
}

const close_test = () => {
  reset_test()
  states.CapInTest = '';
  states.ModelToTest = null;
  delete request_dataRef.value.options;
  delete request_dataRef.value.history;
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
          <el-row>
            <div  class="m-4 rounded-lg shadow-lg p-6 w-80 ml-4 flex flex-col shadow-lg text-left" style="margin: 5px">
              <el-row> <el-text size="default" class="mb-4 text-left">prompt： {{ request_dataRef.userMessage }}</el-text> </el-row>
              <div v-if="states.CapInTest=='image-to-text' && isResGet">
                <el-divider style="margin: 5px"/>
                <el-row > <el-text size="default" line-clamp="5" class="mb-4"  >用户图片url： {{ image_to_sendRef.url }}</el-text> </el-row>
              </div>
            </div>
            <div class=" flex justify-end ">
              <div class="bg-gray-200 hover:text-black flex items-center justify-center w-15 h-15 font-bold shadow-lg">
                用户
              </div>
            </div>
          </el-row>
        </div>
        <div v-if="isResGet" class="flex items-center">
          <el-row>
          <div class="bg-gray-200 hover:text-black flex items-center justify-center h-15 w-auto font-bold shadow-lg">
            {{ response_dataRef.usedModelIdentifier }}
          </div>
          <div class="m-4 bg-blue-100 bg-white rounded-lg shadow-lg p-6 max-w-3/4 ml-4 flex flex-col" style="margin: 5px">
            <p class="mb-4">{{ response_dataRef.assistantMessage }}</p>
          </div>
          </el-row>
        </div>
        <div v-if="!isResGet" class="flex justify-end">
          <el-card class=" text-center w-1/3" shadow="always">
            <el-container class="m-auto flex justify-end w-full" direction="vertical">
              <el-input type="textarea" autosize clearable placeholder="输入测试信息" v-model="request_dataRef.userMessage"></el-input>
              <el-form :rules :model="image_to_sendRef" ref="rule_formRef1">
                <el-form-item prop="url">
                  <el-input :maxlength="512" v-if="states.CapInTest==='image-to-text'" placeholder="输入图片url" v-model="image_to_sendRef.url"></el-input>
                </el-form-item>
              </el-form>
              <el-row class="flex justify-center">
                <el-popover class="w-3/4" placement="bottom" title="若不保存更改则不发送任何可选参数!" :width="400" trigger="click" ref="popoverRef">
                  <template #reference>
                    <el-button class="m-2">更多自定义选项</el-button>
                  </template>
                  <el-form :rules :model="option_dataRef" ref="rule_formRef2">
                    <div class="grid grid-cols-1 gap-4 mb-4 ">
                      <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">历史信息</label>
                        <el-row>
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1</label>
                            <el-input type="text" size="small" :maxlength="255" :minlength="2" v-model="history_dataRef[0].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色1输入</label>
                            <el-input type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="history_dataRef[0].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                        </el-row>
                        <el-row>
                          <el-container class="w-1/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2</label>
                            <el-input clearable type="text" size="small" :maxlength="255" :minlength="2" v-model="history_dataRef[1].role" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                          <el-container class="w-3/4" direction="vertical">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">角色2输入</label>
                            <el-input clearable type="textarea" autosize size="small" :maxlength="255" :minlength="2" v-model="history_dataRef[1].content" id="name" class="w-full border-gray-300 rounded-md shadow-sm" required> </el-input>
                          </el-container>
                        </el-row>
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
                    <el-button ref="buttonRef" @click="cancel_change">不发送自定义数据</el-button>
                    <el-button type="primary" @click="save_change(rule_formRef1)">保存更改</el-button>
                  </div>
                </el-popover>
                <el-button v-if="states.CapInTest==='image-to-text'" class="h-full w-1/4 " type="primary" @click="send_chat_with_img(rule_formRef1)" >发送</el-button>
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

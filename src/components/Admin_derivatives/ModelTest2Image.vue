<script setup lang="ts">
import {ref, } from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";
import {ElMessage, FormInstance, FormRules} from "element-plus";
import {states} from "@/stores"
import {Check,Close} from '@element-plus/icons-vue'

// ts接口,接口命名格式为Format开头的驼峰命名
interface FormatImageInput {
  url?: string;
  base64?: string;
}

interface FormatOptionData {
  x_size?: number;
  y_size?: number;
  size?: string;
  n?: number;
  seed?: number;
  prompt_extend?: boolean;
  watermark?: boolean;
  strength?: number;
}

interface FormatRequestData {
  prompt: string;
  modelInternalId?: number;
  modelIdentifier?: string;
  originImage?: FormatImageInput | null;
  options?: FormatOptionData;
}

interface FormatResponseData {
  imageUrls: string[];
  actualPrompt: string;
  usedModelIdentifier: string;
}

//开关变量,均以is开头，驼峰命名
const isChatOpen = ref(false);//控制聊天窗口开闭
const isWaitRep = ref<boolean>(false);//是否收到模型回应，控制等待模型回答时的进度条开闭
const isResGet = ref<boolean>(false);//是否显示模型回应
const isUsingOptionData = ref<boolean>(false);//是否使用可选参数

//响应式变量,使用蛇形命名,Ref后缀,表示均为ref声明的响应式数据
const request_dataRef = ref<FormatRequestData>({//发给模型的请求
  prompt: '',
  modelIdentifier: '',
});
const option_dataRef = ref<FormatOptionData>({
  x_size: 1024,
  y_size: 1024,
  size: '',
  n: 1,
  seed: 42,
  prompt_extend: true,
  watermark: false,
  strength: 0.5
})
const response_dataRef = ref<FormatResponseData>();
const image_to_sendRef = ref<FormatImageInput>({
  url: ''
});

//特殊数据
const rule_formRef1 = ref<FormInstance>()//用于校验
const buttonRef = ref()
const popoverRef = ref()
const rules = {
  url: [
    { required: true, message: '请输入图片url', trigger: ['blur', 'change'] },
    { pattern: '(http|https)://[\\w\\d./?&=#+-]+\\.(jpg|jpeg|png)', message: '必须是图片格式', trigger: ['blur', 'change'] },
  ],
  x_size: [
    { required: true, message: '请输入图像宽度(像素数)', trigger: 'blur' },
    {type: 'number', message: '请输入512-1440的数值', trigger: ['blur', 'change']}
  ],
  y_size: [
    { required: true, message: '请输入图像高度(像素数)', trigger: 'blur' },
    {type: 'number', message: '请输入512-1440的数值', trigger: ['blur', 'change']}
  ],
  n: [
    { required: true, message: '请输入生成图像数量', trigger: 'blur' },
    {type: 'number', message: '请输入1-4的数值', trigger: ['blur', 'change']}
  ],
  seed: [
    { required: true, message: '请输入seed', trigger: 'blur' },
    {type: 'number', message: '请输入-65536~65536的数值', trigger: ['blur', 'change']}
  ],
  strength: [
    { required: true, message: '请输入修改幅度', trigger: 'blur' },
    {type: 'number', message: '请输入0-1的数值', trigger: ['blur', 'change']}
  ],
}

const waiting = ()=> {
  return '等待模型回应'
}


//函数,蛇形命名,需要以常见的操作名开头
const test_entry= () => {//整个组件的入口，将管理组件传来的key和模型信息存储下来，然后进行之后的测试
  switch (states.CapInTest) {
    case 'text-to-image':
      console.log('开始进行t2i模型测试')
      isChatOpen.value = true;
      break;
    case 'image-to-image':
      console.log('开始进行i2i模型测试')
      isChatOpen.value = true;
      break;
    default:
      ElMessage.warning('遇到了没有注册的类型:'+states.CapInTest)
      break;
  }
}

const send_request =() => {
  if (request_dataRef.value.prompt==='') {ElMessage.warning('提示词不能为空');return;}
  request_dataRef.value.modelIdentifier=states.ModelToTest.modelIdentifier;
  isWaitRep.value=true;
  if (isUsingOptionData.value){
    option_dataRef.value.size = option_dataRef.value.x_size + '*' + option_dataRef.value.y_size;
    request_dataRef.value.options = option_dataRef.value;
    delete request_dataRef.value.options.x_size;
    delete request_dataRef.value.options.y_size;
  }
  if (states.CapInTest==='text-to-image') { delete request_dataRef.value.originImage; }
  const timeoutAlert = setTimeout(() => {
    if(isWaitRep.value) alert('模型30秒内未响应，可能出现问题')
  }, 30000);
  axios.post('/v1/generate-image', request_dataRef.value,{headers: {
      'Content-Type': 'application/json',
      'ACCESS-KEY': states.KeyInUse,
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      clearTimeout(timeoutAlert);
      console.log('clearTimeout');
      response_dataRef.value=data.data;
      option_dataRef.value.x_size = option_dataRef.value.y_size=1024;
      isWaitRep.value=false;
      isResGet.value=true;
    }
    else {ElMessage(data.message); clearTimeout(timeoutAlert);}
  }).catch(error => {error_report(error);reset_test();})
}

const send_request_with_image =(formRef: FormInstance) => {
  formRef.validate((isValid) => {
    if (isValid) {
      request_dataRef.value.originImage = image_to_sendRef.value;
      send_request();
    }
    else ElMessage.warning('请完整填写表单')
  })
}

const cancel_change = () => {
  isUsingOptionData.value=false;
  delete request_dataRef.value.options;
  popoverRef.value.hide();
}

const save_change = (formRef: FormInstance) => {
  formRef.validate((isvalid)=> {
    if (isvalid) {
      isUsingOptionData.value=true;
      popoverRef.value.hide();
    } else ElMessage.warning('请完整填写表单')
  })
}

const close_test = () => {
  reset_test()
  states.CapInTest = '';
  states.ModelToTest = null;
  isChatOpen.value = false;
  delete request_dataRef.value.options;
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
            <div class="m-4 rounded-lg shadow-lg p-6 w-80 ml-4 flex flex-col shadow-lg text-left" style="margin: 5px">
              <el-row> <el-text size="default" class="mb-4 text-left">prompt： {{ request_dataRef.prompt }}</el-text> </el-row>
              <div v-if="states.CapInTest=='image-to-image' && isResGet">
                <el-divider style="margin: 5px"/>
                <el-row > <el-text size="default" line-clamp="5" class="mb-4"  >用户图片url： {{ image_to_sendRef.url }}</el-text> </el-row>
              </div>
            </div>
            <div class="bg-gray-200 hover:text-black flex items-center justify-center w-15 h-15 font-bold shadow-lg">
              用户
            </div>
          </el-row>
        </div>

        <div v-if="isResGet" class="flex">
          <div class="bg-gray-200 hover:text-black flex h-15 w-15 font-bold shadow-lg"> {{ response_dataRef.usedModelIdentifier }} </div>
          <div class="bg-blue-50 rounded-lg shadow-lg max-w-3/4 flex flex-col" style="margin-left: 5px">
            <el-container direction="vertical">
              <el-row>
                <el-row> <el-text>实际使用的prompt：</el-text></el-row>
                <el-text>{{response_dataRef.actualPrompt}}</el-text>
                <el-divider style="margin: 5px"/>
              </el-row>
              <el-row>
                <el-text>生成图片链接:</el-text>
              </el-row>
              <el-row class="w-max-3/4 border-gray" v-for="(url,index) in response_dataRef.imageUrls" :key="index"  >
                <el-text size="small" line-clamp="5" class="w-max-3/4">{{url}}</el-text>
                <el-divider style="margin: 5px" v-if="index!==response_dataRef.imageUrls.length-1"  />
              </el-row>
            </el-container>
          </div>
        </div>
        <div v-if="!isResGet" class="flex justify-end">
          <el-card class=" text-center w-1/3" shadow="always">
            <el-container class="m-auto flex justify-end w-full" direction="vertical">
              <el-input :minlength="1" type="textarea" autosize clearable placeholder="输入prompt" v-model="request_dataRef.prompt"></el-input>
              <el-form v-if="states.CapInTest==='image-to-image'" :rules="rules" :model="image_to_sendRef" ref="rule_formRef1">
                <el-form-item prop="url">
                  <el-input :maxlength="512" placeholder="输入图片url" v-model="image_to_sendRef.url"></el-input>
                </el-form-item>
              </el-form>
              <el-row class="flex justify-center">
                <el-form :model="option_dataRef" :rules="rules" ref="rule_formRef1">
                  <el-popover class="w-3/4" placement="bottom" title="若不保存更改则不发送任何可选参数!" :width="400" trigger="click" ref="popoverRef">
                    <template #reference>
                      <el-button class="m-2">更多自定义选项</el-button>
                    </template>
                    <div class="grid grid-cols-4 gap-4 mb-4 ">
                      <el-row class="">
                        <label class="block text-sm font-medium text-gray-700 mb-1">x-size</label>
                        <el-form-item prop="x_size">
                          <el-input-number class="max-w-3/4" v-model="option_dataRef.x_size" :max="1440" :min="512" controls-position="right" size="small"/>
                        </el-form-item>
                      </el-row>
                      <el-row class="">
                        <label class="block text-sm font-medium text-gray-700 mb-1">y-size</label>
                        <el-form-item prop="y_size">
                          <el-input-number class="max-w-3/4" v-model="option_dataRef.y_size" :max="1440" :min="512" controls-position="right" size="small"/>
                        </el-form-item>
                      </el-row>
                      <el-row class="">
                        <label class="block text-sm font-medium text-gray-700 mb-1">图片数</label>
                        <el-form-item prop="n">
                          <el-input-number class="max-w-3/4" v-model="option_dataRef.n" :max="4" :min="1" controls-position="right" size="small"/>
                        </el-form-item>
                      </el-row>
                      <el-row class="">
                        <label class="block text-sm font-medium text-gray-700 mb-1">种子</label>
                        <el-form-item prop="seed">
                          <el-input-number class="max-w-3/4" v-model="option_dataRef.seed" :max="65536" :min="-65536" controls-position="right" size="small"/>
                        </el-form-item>
                      </el-row>
                    </div>
                    <div class="grid grid-cols-4 gap-4 mb-4 ">
                      <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1 text-center">智能改写</label>
                        <div class="flex justify-center w-full">
                          <el-switch v-model="option_dataRef.prompt_extend" class="mt-2" style="margin-left: 4px" inline-prompt :active-icon="Check" :inactive-icon="Close"/>
                        </div>
                      </div>
                      <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1 text-center">添加水印</label>
                        <div class="flex justify-center w-full">
                          <el-switch v-model="option_dataRef.watermark" class="mt-2" style="margin-left: 4px" inline-prompt :active-icon="Check" :inactive-icon="Close"/>
                        </div>
                      </div>
                      <div v-if="states.CapInTest==='image-to-image'"  class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1 text-center">修改幅度</label>
                        <div class="flex justify-center w-full">
                          <el-form-item prop="strength">
                            <el-form-item prop="strength">
                              <el-input-number v-model="option_dataRef.strength" :max="1.0" :min="0.0" :precision="1" :step="0.1" controls-position="right" size="small"> y_size</el-input-number>
                            </el-form-item>
                          </el-form-item>
                        </div>
                      </div>
                    </div>
                    <div class="flex justify-center" style="margin-top: 5px">
                      <el-button ref="buttonRef" @click="cancel_change">取消更改</el-button>
                      <el-button type="primary" @click="save_change(rule_formRef1)">保存更改</el-button>
                    </div>
                  </el-popover>
                </el-form>
                <el-button v-if="states.CapInTest==='text-to-image'" class="h-full w-1/4 " type="primary" @click="send_request" >发送</el-button>
                <el-button v-if="states.CapInTest==='image-to-image'" class="h-full w-1/4 " type="primary" @click="send_request_with_image(rule_formRef1)" >发送</el-button>
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

</style>
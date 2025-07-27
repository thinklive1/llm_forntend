<script setup lang="ts">

import {ElMessage, FormInstance} from "element-plus";
import axios from "axios";
import {error_report, logout, takeAccessToken} from "@/net/index.js";
import {reactive, ref} from "vue";
import {auth} from "@/stores/index.js"
import KeyAdmin from "@/components/Admin_derivatives/KeyAdmin.vue";

//数据区
const CAPABILITY_MAP = {
  'text-to-text': '文生文',
  'text-to-image': '文生图',
  'image-to-text': '图生文',
  'image-to-image': '图生图',
};

const rules = {
  displayName: [
    { required: true, message: '请输入模型名称', trigger: ['blur', 'change'] },
    { min: 2, max: 50, message: '长度必须在2-50个字符之间', trigger: ['blur', 'change'] },
  ],
  modelIdentifier: [
    { required: true, message: '请输入模型标识', trigger: ['blur','change'] },
    { min: 2, max: 50, message: '长度必须在2-50个字符之间', trigger: ['blur', 'change'] }
  ],
  urlBase: [
    {  message: '请输入模型url', trigger: 'blur' },
    {type: 'url', message: '请输入合法url', trigger: ['blur', 'change']}
  ],
  apiKey: [
    {  message: '请输入模型apikey', trigger: 'blur' },
    {type: 'string', message: '请输入合法的key值', trigger: ['blur', 'change']}
  ],
  priority: [
    { required: true, message: '请输入模型优先级', trigger: 'blur' },
    {type: 'number', message: '请输入合法的优先级', trigger: ['blur', 'change']}
  ],
}


const isModalOpen = ref(false);//用于弹出编辑窗口
const isKeyAdminOpen = ref(false);//用于弹出key管理窗口
const isUsageViewOpen = ref(false);//用于弹出使用量查看窗口
let is_update = false;//区分更新模型和创建模型，注意：退出更新模型窗口时，这个变量必然重置为false
const user_name = ref(sessionStorage.getItem('username'))

const pagination = ref({
  current_page: 1,	//	当前页码，此处默认为第一页
  pages_num: 1,
  total_data: 0,		//	总数据量（不是总页数），此处默认为0条数据
  row_page: 10,		//	每页展示多少条数据，此处为每页展示10条数据,这里可以硬编码修改，不依赖于其他操作
  data: [],			//	存储的展示数据条数，由row_page决定至多有多少条数据
})

const ruleFormRef = ref<FormInstance>()
const model_info = ref<LLM_Model>({//编辑模型信息时的表单信息,默认保存最后一次编辑时的信息
  id: 0,
  displayName: '',
  modelIdentifier: '',
  urlBase: '',
  capabilities: [],
  priority: 1,
  status: false,
});

interface LLM_Model {
  id: number;
  displayName: string;
  modelIdentifier: string;
  urlBase: string;
  capabilities: Array<"text-to-text">;
  priority: number;
  status: boolean | number;
  createdAt?: string;
  apiKey?: string;
  updatedAt?: string;
}

const models= ref<LLM_Model[]>([])

//函数区
const clean_model_info = (obj) => {//用于提交模型后清空模型表单
  Object.keys(obj).forEach(key => {
    delete obj[key];
  });
}

const get_model= (id:number) => { //请求单个模型信息，暂时用不到
  axios.get('/v1/models/'+id, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('get_model success. modelid is '+data.data.id);
      model_info.value = data.data;
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const get_models = () => { //得到当前分页（默认为1）的模型信息，会在进入页面（需要鉴权）后调用一次
  axios.get('/v1/models', {headers: {
      'Content-Type': 'application/json', // 设置数据格式
      'Authorization': `Bearer ${takeAccessToken()}`//令牌
    },
    withCredentials: true, // 如果需要发送 cookie
    params:{'pageNum': pagination.value.current_page,
      'pageSize': pagination.value.row_page,}
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('getmodels success. Num is '+data.data.records.length);
      models.value=data.data.records;
      models.value.forEach((model: LLM_Model) => {
        //console.log(model.status);
        model.status = model.status === 1;//数据库里的类型是int，为了避免麻烦这里手动处理类型转化
      })
      pagination.value.current_page = data.data.current;
      pagination.value.total_data = data.data.total;
      pagination.value.pages_num = data.data.pages;
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}
get_models();

const change_status = (i:number)=>{
  let st = {
    status: 0,
  };
  st.status = Number(models.value[i].status);
  axios.post('/v1/models/'+models.value[i].id+'/status',st, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('update_model status success. updated modelname is '+data.data.displayName);
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const post_model_impl = (formRef: FormInstance) => {//用于处理编辑模型信息提交逻辑，然后调用post_helper
  console.log('Model info:', model_info.value); // 检查 model_info
  if (is_update) {updateModel(formRef);return}
  else if (!model_info.value.apiKey) {ElMessage('注册新模型时，apikey不能为空');return}
  axios.post('/v1/models',model_info.value, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      ElMessage('creat_model success. modelid is '+data.data.id);
      clean_model_info(model_info.value);
      get_models()
      closeModel()
    }
    else ElMessage('something wrong')
  }).catch(error => {error_report(error) })

}

const post_model = (formRef: FormInstance) => {//更新和新建模型合用的入口，更新会用调用另一个函数
  formRef.validate((isvalid)=> {
        if (isvalid) {
          post_model_impl(formRef)
        } else ElMessage('请完整填写表单')
      }
  )
}

const editModel = (i)=>{//用于编辑模型
  model_info.value =Object.assign({},models.value[i]);//能够点击编辑模型时，这个模型对象必然存在，因此不需要先Get
  is_update = true;//表示此时是在编辑而不是创建模型，唯一能设置false的两个函数只有编辑界面的两个按钮对应函数
  isModalOpen.value = true;
}

const updateModel = (formRef: FormInstance)=> {//由于apikey是不返回的，前端也可以不填，此时就不会提交给后端apikey参数，后端检测到这点可以不予更改
  formRef.validate((isvalid)=> {
        if (isvalid) {
          updateModel_impl();
        } else ElMessage('请完整填写表单')
      }
  )
}

const updateModel_impl = ()=>{
  is_update = false;
  axios.put('/v1/models/'+model_info.value.id,model_info.value, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      ElMessage('update_model success. modelname is '+data.data.displayName);
      clean_model_info(model_info.value)
      get_models();
      closeModel()
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const deleteModel = (i:number)=>{
  model_info.value = models.value[i];
  console.log('id:'+model_info.value.id+'\n'+'token:'+takeAccessToken());
  axios.delete('/v1/models/'+model_info.value.id,{
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      ElMessage('delete_model success');
      models.value.splice(i, 1);
      get_models()
      clean_model_info(model_info.value);
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const testModel = (i:number)=>{

}

const openModel = () => { //弹出编辑窗口
  isModalOpen.value = true;
};

const closeModel = () => { //关闭编辑窗口
  isModalOpen.value = false;
  if (is_update) clean_model_info(model_info.value);
  is_update = false;//如果此时进行的是编辑而不是新增，需要重置，等价于直接设置false
};

const handleCurrentChangeClick = () => {
  get_models();
}

const openKeyAdmin = () => {
  isKeyAdminOpen.value = true;
};

const closeKeyAdmin = () => {
  isKeyAdminOpen.value = false;
};

const openUsage = () => {
  isUsageViewOpen.value = true;
};

</script>

<template>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>大模型代理服务管理后台</title>
  </head>

  <body class="bg-gray-50">

  <!-- accesskey管理窗口的组件 -->
  <KeyAdmin :isKeyAdminOpen :username="user_name" @closeKey="closeKeyAdmin"></KeyAdmin>

  <div class="p-6 min-h-screen">
    <header class="flex items-center justify-between pb-4 border-b">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">大模型代理服务管理后台</h1>
        <p class="text-gray-600">集中管理、配置和监控所有接入的大模型。</p>
      </div>
      <el-container style="display: flex; justify-content: flex-end;  margin: 10px;">
        <button id="keyAdmin-btn" @click="openKeyAdmin" class="bg-blue-300 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center" style="margin-right: 10px;">
          <span class="ml-2">管理AccessKeys</span>
        </button>
        <button id="usage-btn" @click="openModel" class="bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center" style="margin-right: 10px;">
          <span class="ml-2">使用量查看</span>
        </button>
        <button id="add-new-model-btn" @click="openModel" class="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center" style="margin-right: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <span class="ml-2">注册新模型</span>
        </button>
      </el-container>
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="modal-overlay absolute inset-0 bg-black opacity-50"></div>
        <div class="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative">
          <h2 id="modal-title" @click="post_model(ruleFormRef)" class="text-xl font-bold mb-4">编辑模型信息</h2>
          <el-form :model="model_info" :rules="rules" ref="ruleFormRef" id="model-form">
            <input type="hidden" id="odel-id-input">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
                <el-form-item prop="displayName">
                  <el-input type="text" size="small" :maxlength="50" :minlength="2" v-model="model_info.displayName" id="name" class="w-full border-gray-300 rounded-md shadow-sm" placeholder="例如：OpenAI GPT-4o" required> </el-input>
                </el-form-item>
              </div>
              <div>
                <label for="modelId" class="block text-sm font-medium text-gray-700 mb-1">模型标识 (Model ID)</label>
                <el-form-item prop="modelIdentifier">
                  <el-input type="text" size="small" :maxlength="50" :minlength="2" v-model="model_info.modelIdentifier" id="modelId" class="w-full border-gray-300 rounded-md shadow-sm" placeholder="例如：gpt-4o" required> </el-input>
                </el-form-item>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="mb-4">
                <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-1">API 密钥</label>
                <el-form-item prop="apiKey">
                  <el-input type="password" size="small" v-model="model_info.apiKey" id="apiKey" class="w-full border-gray-300 rounded-md shadow-sm" placeholder="新增时必填，编辑时留空则不更新"></el-input>
                </el-form-item>
              </div>
              <div class="mb-4">
                <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <el-form-item prop="priority">
                  <el-input-number v-model="model_info.priority" :max="99" :min="1" style="width: 100%;" controls-position="right" size="small" />
                </el-form-item>
                <p class="text-xs text-gray-500 mt-1">最小为1,数字越小，优先级越高。</p>
              </div>
            </div>
            <div class="mb-4">
              <label for="baseurl" class="block text-sm font-medium text-gray-700 mb-1">模型 url</label>
              <el-form-item prop="urlBase">
                <el-input type="text" :maxlength="200" size="small" v-model="model_info.urlBase" id="baseurl" class="w-full border-gray-300 rounded-md shadow-sm" placeholder="调用模型的url"></el-input>
              </el-form-item>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">支持的功能</label>
              <el-checkbox-group v-model="model_info.capabilities">
                <div class="grid grid-cols-2 gap-2 p-3 border rounded-md">
                  <el-checkbox label="t2t" value="text-to-text">文生文</el-checkbox>
                  <el-checkbox label="t2i" value="text-to-image">文生图</el-checkbox>
                  <el-checkbox label="i2t" value="image-to-text">图生文</el-checkbox>
                  <el-checkbox label="i2i" value="image-to-image">图生图</el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
            <div class="flex justify-end space-x-3">
              <el-button @click="closeModel" id="cancel-btn" style="margin-top: 10px" class="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">取消</el-button>
              <el-button type="primary" @click="post_model(ruleFormRef)" style="margin-top: 10px" class="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">提交模型</el-button>
            </div>
          </el-form>
        </div>
      </div>

    </header>

    <main class="mt-6">
      <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg mb-6">
        <div class="flex">
          <div class="py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-500 mr-3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div>
            <p class="font-bold">调用逻辑说明</p>
            <p class="text-sm text-gray-700">当收到用户请求时，系统会根据“支持功能”筛选出可用模型，并按照“优先级”从小到大的顺序依次尝试调用，直到成功为止。</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 w-32">优先级</th>
            <th scope="col" class="px-6 py-3">模型名称 / 标识</th>
            <th scope="col" class="px-6 py-3">支持功能</th>
            <th scope="col" class="px-6 py-3 w-28">状态</th>
            <th scope="col" class="px-6 py-3 w-36 text-right">操作</th>
          </tr>
          </thead>
          <tbody id="model-table-body">
          <!-- Rows will be dynamically inserted here by JavaScript -->
          <tr v-for="(model, index) in models" :key="index">
            <td class="px-6 py-4">{{ model.priority }}</td>
            <td class="px-6 py-4">{{ model.displayName}} / {{ model.modelIdentifier}}</td>
            <td class="px-6 py-4">
              <span v-for="capability in model.capabilities" :key="capability" class="bg-gray-200 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded" style="margin-left: 5px">
                {{ capability }}
              </span>
            </td>
            <td class="px-6 py-4"> <el-switch  v-model="model.status" active-text="上线"
                                               inactive-text="下线" inline-prompt @change="change_status(index)" /></td>
            <td class="px-4 py-4 text-right">
              <button @click="editModel(index)" class="font-medium text-blue-600 hover:underline p-1 ml-2">编辑</button>
              <button @click="testModel(index)" class="font-medium text-green-600 hover:underline p-1 ml-2">测试</button>
              <button @click="deleteModel(index)" class="font-medium text-red-600 hover:underline p-1 ml-2">删除</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex;justify-content: center;margin: 10px">
        <el-pagination  style="display: flex;justify-content: center;"
                        v-model:current-page="pagination.current_page"
                        v-model:page-size="pagination.row_page"
                        hide-on-single-page
                        layout="prev, pager, next"
                        :total="pagination.total_data"
                        @current-change="handleCurrentChangeClick"
        />


        <el-text  style="position: absolute;top: 10px;right: 10px" >您的用户名为: {{user_name}}</el-text>

        <el-container style="position: absolute; bottom: 10px; right: 10px;" direction="horizontal">
          <el-button type="primary" plain  @click="logout()" class="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            注销
          </el-button>
        </el-container>
      </div>
    </main>
  </div>



  </body>
  </html>

</template>



<style>
@import "tailwindcss";
.modal-overlay {
  transition: opacity 0.2s ease-in-out;
}
.modal-content {
  transition: transform 0.2s ease-in-out;
}
.hidden .modal-overlay {
  opacity: 0;
}
.hidden .modal-content {
  transform: scale(0.95);
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
}
.icon-button:hover {
  background-color: #f3f4f6;
}
</style>

<script setup lang="ts">
import {ref} from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";
import {ElMessage} from "element-plus";
import {states} from "@/stores"

const props = defineProps(['isKeyAdminOpen','username']);

// ts接口,接口命名格式为Format开头的驼峰命名
interface FormatAccessKey {
  id: number;
  keyValue: string;
  adminId: number;
  isActive: number | boolean;
  createdAt: string;
}

//响应式变量,使用蛇形命名,Ref后缀,表示均为ref声明的响应式数据
const keys_pageRef = ref<FormatAccessKey[]>();

//特殊数据
const paginationRef = ref({
  current_page: 1,	//	当前页码，此处默认为第一页
  pages_num: 1,     //总页数
  total_data: 0,		//	总数据量（不是总页数），此处默认为0条数据
  row_page: 10,		//	每页展示多少条数据，此处为每页展示10条数据,这里可以硬编码修改，不依赖于其他操作
  data: [],			//	存储的展示数据条数，由row_page决定至多有多少条数据
})
const handle_page  = (page: number) => {
  keys_pageRef.value = states.TotalKeys.slice((page-1)*paginationRef.value.row_page,page*paginationRef.value.row_page);
}
const handle_current_change_click = () => {
  handle_page(paginationRef.value.current_page);
}

//函数,蛇形命名,需要以常见的操作名开头
const get_access_keys = () => {
  axios.get('/v1/auth/access-keys', {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      states.TotalKeys= data.data;
      console.log(states.TotalKeys);
      states.TotalKeys.forEach((key: FormatAccessKey) => { key.isActive = key.isActive === 1; }) //手动处理类型转换
      paginationRef.value.total_data = data.data.length;
      paginationRef.value.pages_num = Math.ceil(data.data.length/paginationRef.value.row_page);
      handle_page(paginationRef.value.current_page);
    }
    else ElMessage(data.message)
  }).catch(error => {error_report(error) })
}
get_access_keys();

const del_access_key = (i: number) => {
  axios.delete('/v1/auth/access-keys/'+keys_pageRef.value[i].id, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      get_access_keys();
    }
    else ElMessage(data.message)
  }).catch(error => {error_report(error) })
}

const create_access_key = (k: FormatAccessKey) => {
  axios.post('/v1/auth/access-keys',k, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('create success.')
      get_access_keys();
    }
    else ElMessage(data.message)
  }).catch(error => {error_report(error) })
}

const get_accKey = (): string => {
  let str ='';
  if (states.TotalKeys===undefined || states.TotalKeys.length===0) {return str}
  states.TotalKeys.forEach((key: FormatAccessKey) => {
    if (key.isActive === true) { str =key.keyValue; return str;}
  })
  return str;
}

defineExpose({ get_access_keys,get_accKey})
</script>

<template>

  <div v-if="props.isKeyAdminOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="modal-content bg-white rounded-lg shadow-xl mx-4 p-6 relative max-h-120 overflow-scroll">
      <div class="bg-white rounded-lg shadow-sm">
        <table class="w-full text-sm text-left text-gray-500 overflow-scroll">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr class="text-center">
            <th scope="col" class="px-6 py-3 w-32">归属用户</th>
            <th scope="col" class="px-6 py-3 w-28">值</th>
            <th scope="col" class="px-6 py-3">状态</th>
            <th scope="col" class="px-6 py-3">创建时间</th>
            <th scope="col" class="px-6 py-3 w-28">操作</th>
          </tr>
          </thead>
          <tbody id="model-table-body">
          <!-- Rows will be dynamically inserted here by JavaScript -->
          <tr class="justify-center items-center" v-for="(akey, index) in keys_pageRef" :key="index">
            <td class="px-6 py-4">{{ username}}</td>
            <td class="px-6 py-4"><el-text style="white-space: nowrap;">{{akey.keyValue}}a</el-text></td>
            <td class="px-6 py-4"> <el-switch  v-model="akey.isActive" active-text="有效"
                                               inactive-text="失效" inline-prompt disabled/></td>
            <td class="px-6 py-4">{{akey.createdAt}}</td>
            <td class="px-6 py-4"><el-button text type="danger" plain @click="del_access_key(index)">删除</el-button></td>
          </tr>
          <tr>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"><el-button type="primary" plain @click="create_access_key">创建新的key</el-button></td>
          </tr>
          </tbody>
        </table>
      </div>
      <div style="display: flex;justify-content: center;margin: 10px">
        <el-pagination  style="display: flex;justify-content: center;"
                        v-model:current-page="paginationRef.current_page"
                        v-model:page-size="paginationRef.row_page"
                        hide-on-single-page
                        layout="prev, pager, next"
                        :total="paginationRef.total_data"
                        @current-change="handle_current_change_click"
        />
      </div>
        <div class="flex justify-center space-x-3" >
        <el-button @click="$emit('closeKey')" id="cancel-btn" style="margin-top: 20px" class=" bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">关闭管理界面</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
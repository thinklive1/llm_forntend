<script setup lang="ts">
import {ref} from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";

const props = defineProps(['isKeyAdminOpen','username']);

interface AccessKey {
  id: number;
  keyValue: string;
  adminId: number;
  isActive: number | boolean;
  createdAt: string;
}
const total_keys = ref<AccessKey[]>();
const keys = ref<AccessKey[]>();

const pagination = ref({
  current_page: 1,	//	当前页码，此处默认为第一页
  pages_num: 1,     //总页数
  total_data: 0,		//	总数据量（不是总页数），此处默认为0条数据
  row_page: 10,		//	每页展示多少条数据，此处为每页展示10条数据,这里可以硬编码修改，不依赖于其他操作
  data: [],			//	存储的展示数据条数，由row_page决定至多有多少条数据
})

const getAccessKeys = () => {
  axios.get('/v1/auth/access-keys', {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      total_keys.value = data.data;
      total_keys.value.forEach((key) => { key.isActive = key.isActive === 1; }) //手动处理类型转换
      pagination.value.total_data = data.data.length;
      pagination.value.pages_num = Math.ceil(data.data.length/pagination.value.row_page);
      handlePage(pagination.value.current_page);
      //ElMessage('getkeys success.');
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}
getAccessKeys();

const delAccessKey = (i: number) => {
  axios.delete('/v1/auth/access-keys/'+keys.value[i].id, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('delete success.');
      getAccessKeys();
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const createAccessKey = (k: AccessKey) => {
  axios.post('/v1/auth/access-keys',k, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      //ElMessage('create success.')
      getAccessKeys();
    }
    else error_report(data)
  }).catch(error => {error_report(error) })

}

const handlePage  = (page: number) => {
  keys.value = total_keys.value.slice((page-1)*pagination.value.row_page,page*pagination.value.row_page);
}



const handleCurrentChangeClick = () => {
handlePage(pagination.value.current_page);
}

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
          <tr class="justify-center items-center" v-for="(akey, index) in keys" :key="index">
            <td class="px-6 py-4">{{ username}}</td>
            <td class="px-6 py-4"><el-text style="white-space: nowrap;">{{akey.keyValue}}a</el-text></td>
            <td class="px-6 py-4"> <el-switch  v-model="akey.isActive" active-text="有效"
                                               inactive-text="失效" inline-prompt disabled/></td>
            <td class="px-6 py-4">{{akey.createdAt}}</td>
            <td class="px-6 py-4"><el-button text type="danger" plain @click="delAccessKey(index)">删除</el-button></td>
          </tr>
          <tr>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"></td>
            <td class="px-6 py-4"><el-button type="primary" plain @click="createAccessKey">创建新的key</el-button></td>
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
      </div>
        <div class="flex justify-center space-x-3" >
        <el-button @click="$emit('closeKey')" id="cancel-btn" style="margin-top: 20px" class=" bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">关闭管理界面</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
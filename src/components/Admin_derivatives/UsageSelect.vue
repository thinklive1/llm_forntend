<script setup lang="ts">

import {h, ref, shallowRef} from "vue";
import axios from "axios";
import {error_report, takeAccessToken} from "@/net/index.js";

const props = defineProps(['isUsageVisible']);

interface ModelUsage {
  date: Date;
  modelId: number;
  modelIdentifier: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
}

interface UsageReq {
  modelId?: number;
  modelIdentifier?: string;
  date?: string;
}


const UsageDatas = ref<ModelUsage[]>();
const UsageDataPage = ref<ModelUsage[]>();
const UsageRequest = ref<UsageReq>({});
const selectedDate = ref<string>();
selectedDate.value = new Date().toISOString().slice(0, 10)

const shortcuts = [
  {
    text: 'Today',
    value: new Date(),
  },
  {
    text: 'Yesterday',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return date
    },
  },
  {
    text: 'A week ago',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
      return date
    },
  },
]

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}

const pagination = ref({
  current_page: 1,	//	当前页码，此处默认为第一页
  pages_num: 1,     //总页数
  total_data: 0,		//	总数据量（不是总页数），此处默认为0条数据
  row_page: 10,		//	每页展示多少条数据，此处为每页展示10条数据,这里可以硬编码修改，不依赖于其他操作
  data: [],			//	存储的展示数据条数，由row_page决定至多有多少条数据
})


const get_usage_datas = () => {
  axios.post('/v1/models/usage',UsageRequest.value, {headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${takeAccessToken()}`
    },
    withCredentials: true, // 如果需要发送 cookie
  }).then(({data}) => {
    if (data.code===200) {
      UsageDatas.value = data.data;
      handleCurrentChangeClick();
      pagination.value.total_data = data.data.length;
      pagination.value.pages_num = Math.ceil(data.data.length/pagination.value.row_page);
      handlePage(pagination.value.current_page);
    }
    else error_report(data)
  }).catch(error => {error_report(error) })
}

const change_date = () => {
  console.log(selectedDate.value)
  UsageRequest.value.date = selectedDate.value;
  get_usage_datas();
}

const handlePage  = (page: number) => {
  UsageDataPage.value = UsageDatas.value.slice((page-1)*pagination.value.row_page,page*pagination.value.row_page);
}

const handleCurrentChangeClick = () => {
  handlePage(pagination.value.current_page);
}

defineExpose({get_usage_datas})
</script>

<template>

  <div v-if="isUsageVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="h-max-3/4 w-1/3 modal-content bg-white rounded-lg shadow-xl mx-4 p-6 relative max-h-120 overflow-scroll">
      <div class="bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-center content-center">
        <el-text>当前选择的日期：</el-text>
        <el-date-picker value-format="YYYY-MM-DD" v-model="selectedDate" @change="change_date" type="date" placeholder="Pick a day" :disabled-date="disabledDate" :shortcuts="shortcuts" size="default" />
        </div>
        <div style="border-top: 1px solid #ccc; margin-top: 4px ;"></div>
        <table class="w-full text-sm text-left text-gray-500 overflow-scroll">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50">
          <tr class="text-center">
            <th scope="col" class="px-6 py-3 w-32">模型名称</th>
            <th scope="col" class="px-6 py-3 w-28">总共请求数</th>
            <th scope="col" class="px-6 py-3">成功请求数</th>
            <th scope="col" class="px-6 py-3">失败请求数</th>
          </tr>
          </thead>
          <tbody id="model-table-body">
          <!-- Rows will be dynamically inserted here by JavaScript -->
          <tr class="justify-center items-center border-gray-700 " v-for="(usage, index) in UsageDataPage" :key="index">
            <td class="px-6 py-4">{{usage.modelIdentifier}}</td>
            <td class="px-6 py-4">{{usage.totalRequests}}</td>
            <td class="px-6 py-4">{{usage.successCount}}</td>
            <td class="px-6 py-4">{{usage.failureCount}}</td>
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
      <div class="flex justify-center items-center">
      <el-button @click="$emit('closeUsage')" id="cancel-btn" style="margin-top: 20px" class=" bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">关闭查看界面</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
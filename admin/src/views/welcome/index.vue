<script setup lang="ts">
import { ref, markRaw, onMounted } from "vue";
import ReCol from "@/components/ReCol";
import { useDark, randomGradient } from "./utils";
import WelcomeTable from "./components/table/index.vue";
import { ReNormalCountTo } from "@/components/ReCountTo";
import { useRenderFlicker } from "@/components/ReFlicker";
import { message } from "@/utils/message";
import { ChartBar, ChartLine, ChartRound } from "./components/charts";
import Segmented, { type OptionsType } from "@/components/ReSegmented";
import { chartData as staticChartData, barChartData as staticBarChartData, latestNewsData as staticLatestNewsData } from "./data";
import {
  getWelcomeStats,
  sendUpdatePush,
  type WelcomeChartItem,
  type WelcomeStats,
  type WelcomeLatestItem
} from "@/api/dashboard";

defineOptions({
  name: "Welcome"
});

const { isDark } = useDark();

let curWeek = ref(1); // 0上周、1本周
const optionsBasis: Array<OptionsType> = [
  {
    label: "上周"
  },
  {
    label: "本周"
  }
];

// 用真实数据初始化，未加载完成时使用静态兜底
type ChartCard = (typeof staticChartData)[number] & {
  data: number[];
  name: string;
  value: number;
};

const chartData = ref<ChartCard[]>(
  staticChartData.map((c) => ({
    ...c,
    name: c.name,
    value: c.value,
    data: [...c.data],
  }))
);
const barChartData = ref<Array<{ requireData: number[]; questionData: number[] }>>(
  staticBarChartData.map((b) => ({
    requireData: [...b.requireData],
    questionData: [...b.questionData],
  }))
);
const latestNewsData = ref<WelcomeLatestItem[]>([...staticLatestNewsData]);

const loading = ref(false);
const pushTitle = ref("");
const pushBody = ref("");
const pushSending = ref(false);

/** 手动给所有订阅用户发送“网站更新”通知 */
async function sendPush() {
  if (pushSending.value) return;
  pushSending.value = true;
  try {
    const res = await sendUpdatePush({
      title: pushTitle.value,
      body: pushBody.value
    });
    message(`已推送给 ${res?.total ?? 0} 位订阅用户`, { type: "success" });
    pushTitle.value = "";
    pushBody.value = "";
  } catch (e: any) {
    message(e?.message ?? "推送失败，请检查 VAPID 配置", { type: "error" });
  } finally {
    pushSending.value = false;
  }
}

// 根据 name 合并 API 返回的 value/data
function mergeByName(
  original: ChartCard[],
  incoming: WelcomeChartItem[]
): ChartCard[] {
  if (!incoming?.length) return original;
  return original.map((item) => {
    const hit = incoming.find((x) => x.name === item.name);
    if (!hit) return item;
    return {
      ...item,
      value: hit.value,
      data: Array.isArray(hit.data) ? hit.data : item.data,
    };
  });
}

async function loadWelcome() {
  loading.value = true;
  try {
    const res = await getWelcomeStats();
    if (res) {
      chartData.value = mergeByName(chartData.value, res.chartData ?? []);
      if (res.barChartData?.length) {
        barChartData.value = res.barChartData;
      }
      if (Array.isArray(res.latestNewsData)) {
        latestNewsData.value = res.latestNewsData;
      }
    }
  } catch (err) {
    console.error("[welcome] load stats failed:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWelcome();
});
</script>

<template>
  <div>
    <el-card shadow="never" class="mb-4.5 push-card">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-md font-medium shrink-0">更新推送</span>
        <el-input
          v-model="pushTitle"
          placeholder="通知标题（留空自动填充）"
          clearable
          style="width: 15rem"
        />
        <el-input
          v-model="pushBody"
          placeholder="要通知的内容，例如：发布了新的说说"
          clearable
          style="width: 22rem"
          @keyup.enter="sendPush"
        />
        <el-button type="primary" :loading="pushSending" @click="sendPush">
          发送给订阅用户
        </el-button>
      </div>
      <p class="mt-2 text-sm text-text_color_regular">
        发布新文章时会自动通知订阅用户；对说说、照片等其他更新，可在此手动推送一条通知。
      </p>
    </el-card>

    <el-row :gutter="24" justify="space-around">
      <re-col
        v-for="(item, index) in chartData"
        :key="index"
        v-motion
        class="mb-4.5"
        :value="6"
        :md="12"
        :sm="12"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 80 * (index + 1)
          }
        }"
      >
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">
              {{ item.name }}
            </span>
            <div
              class="size-8 flex-c rounded-md"
              :style="{
                backgroundColor: isDark ? 'transparent' : item.bgColor
              }"
            >
              <IconifyIconOffline
                :icon="item.icon"
                :color="item.color"
                width="18"
                height="18"
              />
            </div>
          </div>
          <div class="flex justify-between items-start mt-3">
            <div class="w-1/2">
              <ReNormalCountTo
                :duration="item.duration"
                :fontSize="'1.6em'"
                :startVal="100"
                :endVal="item.value"
              />
              <p class="font-medium text-green-500">{{ item.percent }}</p>
            </div>
            <ChartLine
              v-if="item.data.length > 1"
              class="w-1/2!"
              :color="item.color"
              :data="item.data"
            />
            <ChartRound v-else :value="item.value" class="w-1/2!" />
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="18"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 400
          }
        }"
      >
        <el-card class="bar-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">分析概览</span>
            <Segmented v-model="curWeek" :options="optionsBasis" />
          </div>
          <div class="flex justify-between items-start mt-3">
            <ChartBar
              :requireData="barChartData[curWeek].requireData"
              :questionData="barChartData[curWeek].questionData"
            />
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="6"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 480
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">博客统计</span>
          </div>
          <div class="mt-6 space-y-4">
            <div v-for="(item, index) in chartData" :key="index" class="flex justify-between items-center">
              <span class="text-text_color_regular text-sm">{{ item.name }}</span>
              <span class="font-bold text-lg">{{ item.value }}</span>
            </div>
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="18"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 560
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">数据统计</span>
          </div>
          <el-scrollbar max-height="504" class="mt-3">
            <WelcomeTable />
          </el-scrollbar>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="6"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 640
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">最新动态</span>
          </div>
          <el-scrollbar max-height="504" class="mt-3">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in latestNewsData"
                :key="index"
                center
                placement="top"
                :icon="
                  markRaw(
                    useRenderFlicker({
                      background: randomGradient({
                        randomizeHue: true
                      })
                    })
                  )
                "
                :timestamp="item.date"
              >
                <p class="text-text_color_regular text-sm">
                  {{ item.type === 'post' ? `发布文章：${item.title}` : `发布说说：${item.title}` }}
                </p>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </re-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
:deep(.push-card .el-card__body) {
  padding: 16px 20px;
}

:deep(.el-card) {
  --el-card-border-color: none;

  /* 解决概率进度条宽度 */
  .el-progress--line {
    width: 85%;
  }

  /* 解决概率进度条字体大小 */
  .el-progress-bar__innerText {
    font-size: 15px;
  }

  /* 隐藏 el-scrollbar 滚动条 */
  .el-scrollbar__bar {
    display: none;
  }

  /* el-timeline 每一项上下、左右边距 */
  .el-timeline-item {
    margin: 0 6px;
  }
}

:deep(.el-timeline.is-start) {
  padding-left: 0;
}

.main-content {
  margin: 20px 20px 0 !important;
}
</style>

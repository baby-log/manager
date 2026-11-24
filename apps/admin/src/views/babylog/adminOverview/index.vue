<script setup lang="ts">
defineOptions({ name: 'BabylogAdminOverview' });
import { onMounted, ref } from 'vue';
import { ElButton } from 'element-plus';
import type { AdminOverviewVO } from '@pivotos/types';
import { getAdminOverview } from '@/api/babylog/adminConsole';

/**
 * BabyLog 后台数据总览（M53，/babylog/admin/overview）。
 * 只读：跨用户查询、涉及婴儿健康敏感数据，本页仅展示 7 项计数，查看操作留审计；
 * 本批不提供任何编辑 / 删除 / 导出入口。
 * 数值口径：Long/Integer 都可能是字符串，直接展示不做任何数值运算（防 NaN）。
 */
const loading = ref(false);
const overview = ref<AdminOverviewVO | null>(null);

const CARDS: { key: keyof AdminOverviewVO; label: string; hint: string }[] = [
  { key: 'userCount', label: '注册用户', hint: '全部账号' },
  { key: 'familyCount', label: '家庭', hint: '已创建家庭' },
  { key: 'childCount', label: '宝宝', hint: '含已归档' },
  { key: 'feedingCount', label: '喂养记录', hint: '累计' },
  { key: 'vaccinationCount', label: '疫苗接种', hint: '累计' },
  { key: 'reminderCount', label: '提醒', hint: '累计' },
  { key: 'todayRecordCount', label: '今日记录', hint: '当日新增' },
];

async function load(): Promise<void> {
  loading.value = true;
  try {
    overview.value = await getAdminOverview();
  } finally {
    loading.value = false;
  }
}

onMounted(() => void load());
</script>

<template>
  <div class="page-card">
    <div class="admin-overview__notice">
      只读页面 · 跨用户查询 · 涉及婴儿健康敏感数据，所有查看操作留审计；本批不提供编辑、删除、导出。
    </div>

    <div class="admin-overview__bar">
      <span class="admin-overview__title">数据总览</span>
      <ElButton size="small" :loading="loading" @click="load">刷新</ElButton>
    </div>

    <div class="admin-overview__grid">
      <div v-for="card in CARDS" :key="card.key" class="admin-overview__card">
        <div class="admin-overview__label">{{ card.label }}</div>
        <div class="admin-overview__value">{{ overview ? (overview[card.key] ?? '—') : '—' }}</div>
        <div class="admin-overview__hint">{{ card.hint }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-overview__notice {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.admin-overview__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.admin-overview__title {
  font-size: 15px;
  font-weight: 600;
}

.admin-overview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.admin-overview__card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.admin-overview__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.admin-overview__value {
  margin: 8px 0 4px;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-all;
}

.admin-overview__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

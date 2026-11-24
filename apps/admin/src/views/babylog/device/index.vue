<script setup lang="ts">
defineOptions({ name: 'BabylogDevice' });
import { ref } from 'vue';
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTableColumn, ElTag } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { YTable } from '@pivotos/ui';
import type { YTableColumn } from '@pivotos/ui';
import type { AdminDeviceOverviewVO, DeviceVO } from '@pivotos/types';
import { formatDate } from '@pivotos/core';
import { getDeviceOverview, kickDevice } from '@/api/babylog/device';

/**
 * 设备查看（M10 契约：/babylog/device，非分页——overview 一次返回账号全部设备）。
 * account 传用户名或邮箱（服务端用户名精确查 → 邮箱兜底，都 miss 报 8362）。
 */

const account = ref('');
const loading = ref(false);
const overview = ref<AdminDeviceOverviewVO | null>(null);

async function handleSearch(): Promise<void> {
  const keyword = account.value.trim();
  if (!keyword) {
    ElMessage.warning('请输入用户名或邮箱再查询');
    return;
  }
  loading.value = true;
  try {
    overview.value = await getDeviceOverview(keyword);
  } finally {
    loading.value = false;
  }
}

/** epoch millis 字符串 → 展示时间 */
function formatMillis(value?: string): string {
  return value ? formatDate(Number(value)) : '—';
}

const columns: YTableColumn<DeviceVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 90, align: 'center' },
  { prop: 'deviceUuid', label: '设备标识', minWidth: 220, showOverflowTooltip: true },
  { prop: 'deviceName', label: '设备名', minWidth: 130, showOverflowTooltip: true },
  { prop: 'platform', label: '平台', width: 100, align: 'center' },
  { prop: 'appVersion', label: 'App 版本', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'workerId', label: 'workerId', width: 90, align: 'center' },
  { prop: 'lastActiveAt', label: '最后活跃', width: 170, slot: 'lastActiveAt' },
];

// ---------- 踢出（与本人移除同语义：拦 refresh，重新登录可复活） ----------
async function handleKick(row: DeviceVO): Promise<void> {
  const name = row.deviceName || row.deviceUuid.slice(0, 8);
  await ElMessageBox.confirm(
    `确定踢出设备「${name}」吗？该设备的登录凭证刷新将立即失效，用户重新登录后可恢复使用。`,
    '踢出确认',
    { type: 'warning', confirmButtonText: '确认踢出', cancelButtonText: '取消' },
  );
  await kickDevice(row.id);
  ElMessage.success('已踢出');
  await handleSearch();
}
</script>

<template>
  <div class="page-card">
    <div class="device-page__search">
      <ElInput
        v-model="account"
        class="device-page__input"
        placeholder="用户名或邮箱（精确匹配）"
        clearable
        @keyup.enter="handleSearch"
      />
      <ElButton v-hasPermi="'babylog:device:list'" type="primary" :icon="Search" :loading="loading" @click="handleSearch">
        查询
      </ElButton>
    </div>

    <template v-if="overview">
      <div class="device-page__summary">
        <span>用户 ID：{{ overview.userId }}</span>
        <span>用户名：{{ overview.username }}</span>
        <span>昵称：{{ overview.nickname || '—' }}</span>
        <span>邮箱：{{ overview.email || '—' }}</span>
        <ElTag :type="overview.status === 0 ? 'success' : 'danger'" disable-transitions>
          {{ overview.status === 0 ? '正常' : '停用' }}
        </ElTag>
        <span>设备数：{{ overview.devices?.length ?? 0 }}</span>
      </div>

      <YTable
        :loading="loading"
        :data="overview.devices ?? []"
        :columns="columns"
        row-key="id"
        hide-pagination
        @refresh="handleSearch"
      >
        <template #status="{ row }">
          <ElTag :type="(row as DeviceVO).status === 'ACTIVE' ? 'success' : 'info'" disable-transitions>
            {{ (row as DeviceVO).status === 'ACTIVE' ? '活跃' : '已移除' }}
          </ElTag>
        </template>
        <template #lastActiveAt="{ row }">
          {{ formatMillis((row as DeviceVO).lastActiveAt) }}
        </template>
        <ElTableColumn label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="(row as DeviceVO).status === 'ACTIVE'"
              v-hasPermi="'babylog:device:kick'"
              link
              type="danger"
              @click="handleKick(row as DeviceVO)"
            >
              踢出
            </ElButton>
          </template>
        </ElTableColumn>
      </YTable>
    </template>

    <div v-else class="device-page__empty">
      输入账号后查询：将展示该账号下全部设备（含已被移除的），按最后活跃倒序。
    </div>
  </div>
</template>

<style scoped>
.device-page__search {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.device-page__input {
  width: 320px;
}

.device-page__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.device-page__empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

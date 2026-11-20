<script setup lang="ts">
defineOptions({ name: 'BabylogAdminUser' });
import { ElTag } from 'element-plus';
import { YSearchForm, YTable } from '@pivotos/ui';
import type { YFormSchema, YTableColumn } from '@pivotos/ui';
import type { AdminUserQuery, AdminUserVO } from '@pivotos/types';
import { ADMIN_API, formatAdminTime } from '@/api/babylog/adminConsole';
import { useTablePage } from '@/hooks';

/**
 * 所有人 · 用户列表（M53，/babylog/admin/user/page）。
 * 只读：跨用户查看账号与关联数量，无编辑 / 删除 / 导出；查看操作留审计。
 */
const { loading, rows, total, params, load, search, reset } = useTablePage<AdminUserVO, AdminUserQuery>({
  url: ADMIN_API.userPage,
  query: { keyword: '' },
});

const searchSchemas: YFormSchema[] = [
  { field: 'keyword', label: '关键字', component: 'input', placeholder: '用户名 / 昵称 / 邮箱' },
];

function statusText(v?: string | number): string {
  if (v == null || v === '') return '—';
  const s = String(v);
  if (s === '0' || s === 'NORMAL' || s === 'ACTIVE') return '正常';
  if (s === '1' || s === 'DISABLED' || s === 'INACTIVE') return '停用';
  return s;
}

function statusType(v?: string | number): 'success' | 'danger' | 'info' {
  const s = v == null ? '' : String(v);
  if (s === '0' || s === 'NORMAL' || s === 'ACTIVE') return 'success';
  if (s === '1' || s === 'DISABLED' || s === 'INACTIVE') return 'danger';
  return 'info';
}

const columns: YTableColumn<AdminUserVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'userId', label: '用户 ID', width: 180, showOverflowTooltip: true },
  { prop: 'username', label: '用户名', minWidth: 130 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'childCount', label: '宝宝数', width: 90, align: 'center' },
  { prop: 'deviceCount', label: '设备数', width: 90, align: 'center' },
  { prop: 'createTime', label: '注册时间', width: 180, formatter: (row) => formatAdminTime(row.createTime) },
];
</script>

<template>
  <div class="page-card">
    <div class="admin-user__tip">只读查询：跨用户账号信息，涉及敏感数据，查看操作留审计。</div>
    <YSearchForm v-model="params" :schemas="searchSchemas" @search="search" @reset="reset" />
    <YTable
      v-model:page-num="params.pageNum"
      v-model:page-size="params.pageSize"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :total="total"
      row-key="userId"
      @refresh="load"
    >
      <template #status="{ row }">
        <ElTag :type="statusType((row as AdminUserVO).status)" disable-transitions>
          {{ statusText((row as AdminUserVO).status) }}
        </ElTag>
      </template>
    </YTable>
  </div>
</template>

<style scoped>
.admin-user__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<script setup lang="ts">
defineOptions({ name: 'BabylogAdminFamily' });
import { YSearchForm, YTable } from '@pivotos/ui';
import type { YFormSchema, YTableColumn } from '@pivotos/ui';
import type { AdminFamilyQuery, AdminFamilyVO } from '@pivotos/types';
import { ADMIN_API, formatAdminTime } from '@/api/babylog/adminConsole';
import { useTablePage } from '@/hooks';

/** 家庭列表（M53，/babylog/admin/family/page）。只读，跨用户查看，操作留审计。 */
const { loading, rows, total, params, load, search, reset } = useTablePage<AdminFamilyVO, AdminFamilyQuery>({
  url: ADMIN_API.familyPage,
  query: { keyword: '' },
});

const searchSchemas: YFormSchema[] = [
  { field: 'keyword', label: '关键字', component: 'input', placeholder: '家庭名 / 户主' },
];

const columns: YTableColumn<AdminFamilyVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'familyId', label: '家庭 ID', width: 180, showOverflowTooltip: true },
  { prop: 'familyName', label: '家庭名', minWidth: 150 },
  { prop: 'ownerUserId', label: '户主用户 ID', width: 180, showOverflowTooltip: true },
  { prop: 'ownerName', label: '户主', minWidth: 120 },
  { prop: 'memberCount', label: '成员数', width: 90, align: 'center' },
  { prop: 'childCount', label: '宝宝数', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 180, formatter: (row) => formatAdminTime(row.createTime) },
];
</script>

<template>
  <div class="page-card">
    <div class="admin-family__tip">只读查询：跨用户家庭信息，涉及敏感数据，查看操作留审计。</div>
    <YSearchForm v-model="params" :schemas="searchSchemas" @search="search" @reset="reset" />
    <YTable
      v-model:page-num="params.pageNum"
      v-model:page-size="params.pageSize"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :total="total"
      row-key="familyId"
      @refresh="load"
    />
  </div>
</template>

<style scoped>
.admin-family__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

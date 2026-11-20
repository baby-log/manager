<script setup lang="ts">
defineOptions({ name: 'BabylogAdminChild' });
import { YSearchForm, YTable } from '@pivotos/ui';
import type { YFormSchema, YTableColumn } from '@pivotos/ui';
import type { AdminChildQuery, AdminChildVO } from '@pivotos/types';
import { ADMIN_API, formatAdminBool, formatAdminTime } from '@/api/babylog/adminConsole';
import { useTablePage } from '@/hooks';

/** 宝宝列表（M53，/babylog/admin/child/page）。只读，跨用户查看婴儿敏感数据，操作留审计。 */
const { loading, rows, total, params, load, search, reset } = useTablePage<AdminChildVO, AdminChildQuery>({
  url: ADMIN_API.childPage,
  query: { userId: '', familyId: '', keyword: '' },
});

const searchSchemas: YFormSchema[] = [
  { field: 'userId', label: '用户 ID', component: 'input', placeholder: '按所属用户筛选' },
  { field: 'familyId', label: '家庭 ID', component: 'input', placeholder: '按家庭筛选' },
  { field: 'keyword', label: '关键字', component: 'input', placeholder: '宝宝姓名' },
];

const GENDER_LABEL: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
  male: '男',
  female: '女',
  unknown: '未知',
  '1': '男',
  '2': '女',
  '0': '未知',
};

function genderText(v?: string | number): string {
  if (v == null || v === '') return '—';
  return GENDER_LABEL[String(v)] ?? String(v);
}

const columns: YTableColumn<AdminChildVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: '宝宝 ID', width: 180, showOverflowTooltip: true },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'gender', label: '性别', width: 90, align: 'center', formatter: (row) => genderText(row.gender) },
  { prop: 'birthday', label: '生日', width: 130, formatter: (row) => formatAdminTime(row.birthday) },
  { prop: 'isPremature', label: '早产', width: 90, align: 'center', formatter: (row) => formatAdminBool(row.isPremature) },
  { prop: 'archived', label: '已归档', width: 90, align: 'center', formatter: (row) => formatAdminBool(row.archived) },
  { prop: 'ownerUserId', label: '所属用户 ID', width: 180, showOverflowTooltip: true },
  { prop: 'familyId', label: '家庭 ID', width: 180, showOverflowTooltip: true },
  { prop: 'createdAt', label: '创建时间', width: 180, formatter: (row) => formatAdminTime(row.createdAt) },
];
</script>

<template>
  <div class="page-card">
    <div class="admin-child__tip">只读查询：跨用户宝宝档案，涉及婴儿敏感数据，查看操作留审计。</div>
    <YSearchForm v-model="params" :schemas="searchSchemas" @search="search" @reset="reset" />
    <YTable
      v-model:page-num="params.pageNum"
      v-model:page-size="params.pageSize"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :total="total"
      row-key="id"
      @refresh="load"
    />
  </div>
</template>

<style scoped>
.admin-child__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

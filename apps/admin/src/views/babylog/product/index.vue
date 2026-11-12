<script setup lang="ts">
defineOptions({ name: 'BabylogProduct' });
import { computed, reactive, ref } from 'vue';
import { ElButton, ElMessage, ElMessageBox, ElTableColumn, ElTag } from 'element-plus';
import { YDialog, YForm, YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type { ProductEditRequest, ProductQuery, ProductVO } from '@pivotos/types';
import { formatDate } from '@pivotos/core';
import { getProduct, removeProduct, updateProduct } from '@/api/babylog/product';
import { useTablePage } from '@/hooks';

/**
 * 内置产品库（M10 契约：/babylog/product，固定 is_builtin=1）。
 * 无新增按钮：内置行（id 1~99）只由服务端 seed（V2.2.8，32 行）产生，
 * 管理端仅查 / 编辑（含上下架）/ 软删；改动经 App 端 base 通道增量下发。
 */

// ---------- 列表 ----------
const { loading, rows, total, params, load, search, reset } = useTablePage<ProductVO, ProductQuery>({
  url: '/babylog/product/page',
  query: { category: '', brand: '', name: '', enabled: '' },
});

const CATEGORY_OPTIONS: YFormOption[] = [
  { label: '奶粉', value: 'FORMULA' },
  { label: '补剂', value: 'SUPPLEMENT' },
  { label: '药品', value: 'MEDICINE' },
  { label: '纸尿裤', value: 'DIAPER' },
];

const ENABLED_OPTIONS: YFormOption[] = [
  { label: '在售', value: 1 },
  { label: '下架', value: 0 },
];

const searchSchemas: YFormSchema[] = [
  { field: 'category', label: '分类', component: 'select', placeholder: '全部', options: CATEGORY_OPTIONS },
  { field: 'brand', label: '品牌', component: 'input', placeholder: '按品牌模糊查询' },
  { field: 'name', label: '品名', component: 'input', placeholder: '按品名模糊查询' },
  { field: 'enabled', label: '状态', component: 'select', placeholder: '全部', options: ENABLED_OPTIONS },
];

/** epoch millis 字符串 → 展示时间（Long 全局序列化为 String，前端按字符串解析） */
function formatMillis(value?: string): string {
  return value ? formatDate(Number(value)) : '—';
}

const columns: YTableColumn<ProductVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'category', label: '分类', width: 90, align: 'center', slot: 'category' },
  { prop: 'brand', label: '品牌', minWidth: 110 },
  { prop: 'name', label: '品名', minWidth: 150 },
  { prop: 'spec', label: '规格', minWidth: 110 },
  { prop: 'defaultDose', label: '默认剂量', minWidth: 100 },
  { prop: 'enabled', label: '状态', width: 80, align: 'center', slot: 'enabled' },
  { prop: 'version', label: '同步版本', width: 90, align: 'center' },
  { prop: 'serverUpdatedAt', label: '最后维护', width: 170, slot: 'serverUpdatedAt' },
];

// ---------- 编辑（无新增：内置行只由服务端 seed 产生） ----------
const dialogVisible = ref(false);
const confirmLoading = ref(false);
const formRef = ref<InstanceType<typeof YForm>>();
const formModel = reactive<Record<string, unknown>>({});
const isEdit = computed(() => !!formModel.id);

const formSchemas: YFormSchema[] = [
  {
    field: 'category',
    label: '分类',
    component: 'select',
    emptyOption: false,
    options: CATEGORY_OPTIONS,
    rules: [{ required: true, message: '分类不能为空', trigger: 'change' }],
  },
  {
    field: 'brand',
    label: '品牌',
    component: 'input',
    placeholder: '最长 100 字',
    rules: [{ required: true, message: '品牌不能为空', trigger: 'blur' }],
  },
  {
    field: 'name',
    label: '品名',
    component: 'input',
    placeholder: '最长 100 字',
    rules: [{ required: true, message: '品名不能为空', trigger: 'blur' }],
  },
  { field: 'spec', label: '规格', component: 'input', placeholder: '如 900g/罐，最长 100 字' },
  { field: 'defaultDose', label: '默认剂量', component: 'input', placeholder: '如 30ml/次，最长 100 字' },
  { field: 'iconPath', label: '图标', component: 'input', placeholder: 'plugin-file 的 file_id（可空）' },
  { field: 'note', label: '备注', component: 'textarea', placeholder: '最长 500 字' },
  {
    field: 'enabled',
    label: '上架',
    component: 'radio',
    options: ENABLED_OPTIONS,
    rules: [{ required: true, message: '上架状态不能为空', trigger: 'change' }],
  },
];

async function openEdit(row: ProductVO): Promise<void> {
  const detail = await getProduct(row.id);
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, { ...detail });
  dialogVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()?.catch(() => false);
  if (!valid) return;
  confirmLoading.value = true;
  try {
    const body: ProductEditRequest = {
      category: formModel.category as string,
      brand: formModel.brand as string,
      name: formModel.name as string,
      spec: (formModel.spec as string) || undefined,
      defaultDose: (formModel.defaultDose as string) || undefined,
      note: (formModel.note as string) || undefined,
      iconPath: (formModel.iconPath as string) || undefined,
      enabled: formModel.enabled as number,
    };
    await updateProduct(formModel.id as string, body);
    ElMessage.success('保存成功（App 端将经基础数据通道增量同步）');
    dialogVisible.value = false;
    await load();
  } finally {
    confirmLoading.value = false;
  }
}

// ---------- 软删（置墓碑，不可恢复） ----------
async function handleDelete(row: ProductVO): Promise<void> {
  await ElMessageBox.confirm(
    `确定删除「${row.brand} ${row.name}」吗？删除后 App 端将隐藏该产品，且不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
  );
  await removeProduct(row.id);
  ElMessage.success('已删除（墓碑行，不可恢复）');
  await load();
}
</script>

<template>
  <div class="page-card">
    <div class="product-page__tip">
      内置产品库只维护服务端预置行（id 1~99），不提供新增；编辑与上下架改动会经 App 端基础数据通道增量下发。
    </div>

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
    >
      <template #category="{ row }">
        <ElTag disable-transitions>
          {{ CATEGORY_OPTIONS.find((o) => o.value === (row as ProductVO).category)?.label ?? (row as ProductVO).category }}
        </ElTag>
      </template>
      <template #enabled="{ row }">
        <ElTag :type="(row as ProductVO).enabled === 1 ? 'success' : 'info'" disable-transitions>
          {{ (row as ProductVO).enabled === 1 ? '在售' : '下架' }}
        </ElTag>
      </template>
      <template #serverUpdatedAt="{ row }">
        {{ formatMillis((row as ProductVO).serverUpdatedAt) }}
      </template>
      <ElTableColumn label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton v-hasPermi="'babylog:product:query'" link type="primary" @click="openEdit(row as ProductVO)">
            编辑
          </ElButton>
          <ElButton v-hasPermi="'babylog:product:remove'" link type="danger" @click="handleDelete(row as ProductVO)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </YTable>

    <YDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑内置产品' : '内置产品'"
      width="640px"
      :confirm-loading="confirmLoading"
      @confirm="handleSubmit"
    >
      <YForm ref="formRef" v-model="formModel" :schemas="formSchemas" label-width="90px" />
    </YDialog>
  </div>
</template>

<style scoped>
.product-page__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

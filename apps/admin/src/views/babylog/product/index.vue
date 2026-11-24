<script setup lang="ts">
defineOptions({ name: 'BabylogProduct' });
import { computed, reactive, ref } from 'vue';
import {
  ElButton,
  ElFormItem,
  ElMessage,
  ElMessageBox,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';
import { YDialog, YForm, YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type { ProductEditRequest, ProductQuery, ProductVO } from '@pivotos/types';
import { formatDate } from '@pivotos/core';
import { getProduct, removeProduct, updateProduct } from '@/api/babylog/product';
import { presignDownload, uploadFileWithMeta } from '@/api/file';
import { useTablePage } from '@/hooks';

/**
 * 内置产品库（M10 契约：/babylog/product，固定 is_builtin=1）。
 * 无新增按钮：内置行（id 1~99）只由服务端 seed（V2.2.8，32 行）产生，
 * 管理端仅查 / 编辑（含上下架）/ 软删；改动经 App 端 base 通道增量下发。
 * M38：图标字段由手填 file_id 改为内嵌 el-upload 直传 plugin-file（沿用管理端登录态），
 * 上传成功回填 file_id + 即时预览；替换/移除后旧文件不即时删除，按 M13 孤儿差集
 * 清理口径回收（引用解除即孤儿，由清理器统一处理）。
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
  { prop: 'sortOrder', label: '排序', width: 76, align: 'center' },
  { prop: 'enabled', label: '状态', width: 80, align: 'center', slot: 'enabled' },
  { prop: 'defaultCount', label: '默认数', width: 80, align: 'center' },
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
  {
    field: 'sortOrder',
    label: '排序',
    component: 'number',
    props: { min: 0, max: 999999, step: 10 },
    placeholder: '数字越大越靠前（0~999999）',
  },
  { field: 'note', label: '备注', component: 'textarea', placeholder: '最长 500 字' },
  {
    field: 'enabled',
    label: '上架',
    component: 'radio',
    options: ENABLED_OPTIONS,
    rules: [{ required: true, message: '上架状态不能为空', trigger: 'change' }],
  },
];

// ---------- 图标上传（M38：内嵌 el-upload 直传 plugin-file，回填 file_id） ----------
/** 图标场景限制：plugin-file 扩展名白名单中的图片子集 + ≤500KB */
const ICON_ACCEPT_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
const ICON_MAX_BYTES = 500 * 1024;
const ICON_ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.svg';

/** file_id → fileUrl 预览缓存（sessionStorage）：编辑回显时换限时可访问 URL */
const ICON_URL_CACHE_KEY = 'babylog:product-icon-urls';

function readIconUrlCache(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(ICON_URL_CACHE_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function stashIconUrl(id: string, fileUrl: string): void {
  const cache = readIconUrlCache();
  cache[id] = fileUrl;
  sessionStorage.setItem(ICON_URL_CACHE_KEY, JSON.stringify(cache));
}

const iconUploading = ref(false);
const iconPreviewUrl = ref('');

/** 按 file_id 回显预览：缓存命中换预签名 URL；未命中（M38 前手填的旧 file_id）仅提示不可预览 */
async function refreshIconPreview(fileId?: string): Promise<void> {
  iconPreviewUrl.value = '';
  if (!fileId) return;
  const cached = readIconUrlCache()[fileId];
  if (!cached) return;
  try {
    iconPreviewUrl.value = await presignDownload(cached);
  } catch {
    iconPreviewUrl.value = '';
  }
}

function validateIconFile(file: File): boolean {
  const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : '';
  if (!ICON_ACCEPT_EXTS.includes(ext)) {
    ElMessage.error(`不支持的图标类型${ext ? ` .${ext}` : ''}，仅支持 png / jpg / webp / svg`);
    return false;
  }
  if (file.size > ICON_MAX_BYTES) {
    ElMessage.error(`图标大小不能超过 500KB（当前 ${(file.size / 1024).toFixed(0)}KB）`);
    return false;
  }
  return true;
}

async function handleIconUpload(options: UploadRequestOptions): Promise<void> {
  const file = options.file;
  if (!validateIconFile(file)) return;
  iconUploading.value = true;
  try {
    const { id, fileUrl } = await uploadFileWithMeta(file);
    // 替换图标：旧 file_id 引用解除后不即时删除，进 M13 孤儿差集清理口径
    formModel.iconPath = id;
    stashIconUrl(id, fileUrl);
    await refreshIconPreview(id);
    ElMessage.success('图标已上传，file_id 已自动回填');
  } catch (err) {
    ElMessage.error(`图标上传失败：${err instanceof Error ? err.message : '未知错误'}`);
  } finally {
    iconUploading.value = false;
  }
}

/** 移除图标：仅解除引用（formModel.iconPath 清空），旧文件同走孤儿清理口径 */
function handleIconClear(): void {
  formModel.iconPath = undefined;
  iconPreviewUrl.value = '';
}

async function openEdit(row: ProductVO): Promise<void> {
  const detail = await getProduct(row.id);
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, { ...detail });
  await refreshIconPreview(detail.iconPath);
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
      // 服务端 @NotNull：清空后按 0 提交，否则整单校验被拒（M67）
      sortOrder: formModel.sortOrder == null || formModel.sortOrder === '' ? 0 : Number(formModel.sortOrder),
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
      排序数字越大越靠前（四端选择列表同口径）；「默认数」是各家庭设为本类默认的偏好行聚合数，跨账号只读。
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
      <YForm ref="formRef" v-model="formModel" :schemas="formSchemas" label-width="90px">
        <ElFormItem label="图标">
          <div class="icon-upload">
            <img v-if="iconPreviewUrl" :src="iconPreviewUrl" class="icon-upload__thumb" alt="产品图标预览" />
            <div v-else-if="formModel.iconPath" class="icon-upload__placeholder">
              已设置 file_id={{ formModel.iconPath }}（非本会话上传，无法预览）
            </div>
            <div v-else class="icon-upload__placeholder">未设置图标</div>
            <ElUpload
              :show-file-list="false"
              :accept="ICON_ACCEPT_ATTR"
              :http-request="handleIconUpload"
            >
              <ElButton :loading="iconUploading">
                {{ formModel.iconPath ? '更换图标' : '上传图标' }}
              </ElButton>
            </ElUpload>
            <ElButton v-if="formModel.iconPath" link type="danger" @click="handleIconClear">移除</ElButton>
          </div>
          <div class="icon-upload__tip">
            支持 png / jpg / webp / svg，≤500KB；上传后自动回填 file_id 并即时预览；
            更换或移除后旧文件不即时删除，按孤儿清理口径统一回收。
          </div>
        </ElFormItem>
      </YForm>
    </YDialog>
  </div>
</template>

<style scoped>
.product-page__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.icon-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.icon-upload__thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.icon-upload__placeholder {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.icon-upload__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
</style>

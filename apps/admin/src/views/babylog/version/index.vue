<script setup lang="ts">
defineOptions({ name: 'BabylogVersion' });
import { computed, reactive, ref } from 'vue';
import { ElButton, ElMessage, ElMessageBox, ElTableColumn, ElTag } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { YDialog, YForm, YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type { AppVersionQuery, AppVersionSaveRequest, AppVersionVO } from '@pivotos/types';
import { createVersion, publishVersion, removeVersion, updateVersion } from '@/api/babylog/version';
import { useTablePage } from '@/hooks';

/**
 * 版本公告（M10 契约：/babylog/version，bl_app_version）。
 * 状态机 DRAFT → PUBLISHED 单向：已发布行锁定不可改/删（8391）；
 * 要改内容就发新 versionCode。App 端升级检查端点（拉最新 PUBLISHED）属 V3。
 */

// ---------- 列表 ----------
const { loading, rows, total, params, load, search, reset } = useTablePage<AppVersionVO, AppVersionQuery>({
  url: '/babylog/version/page',
  query: { platform: '', status: '' },
});

const PLATFORM_OPTIONS: YFormOption[] = [
  { label: 'Android', value: 'ANDROID' },
  { label: 'iOS', value: 'IOS' },
];

const STATUS_OPTIONS: YFormOption[] = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
];

const searchSchemas: YFormSchema[] = [
  { field: 'platform', label: '平台', component: 'select', placeholder: '全部', options: PLATFORM_OPTIONS },
  { field: 'status', label: '状态', component: 'select', placeholder: '全部', options: STATUS_OPTIONS },
];

const columns: YTableColumn<AppVersionVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 90, align: 'center' },
  { prop: 'platform', label: '平台', width: 90, align: 'center', slot: 'platform' },
  { prop: 'versionCode', label: '版本号', width: 90, align: 'center' },
  { prop: 'versionName', label: '版本名', width: 110, align: 'center' },
  { prop: 'forceUpdate', label: '强制更新', width: 90, align: 'center', slot: 'forceUpdate' },
  { prop: 'downloadUrl', label: '下载地址', minWidth: 180, showOverflowTooltip: true },
  { prop: 'notice', label: '更新说明', minWidth: 200, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 170 },
];

// ---------- 新增 / 编辑（均为 DRAFT；编辑仅对草稿行开放） ----------
const dialogVisible = ref(false);
const confirmLoading = ref(false);
const formRef = ref<InstanceType<typeof YForm>>();
const formModel = reactive<Record<string, unknown>>({});
const isEdit = computed(() => !!formModel.id);

const formSchemas: YFormSchema[] = [
  {
    field: 'platform',
    label: '平台',
    component: 'radio',
    options: PLATFORM_OPTIONS,
    rules: [{ required: true, message: '平台不能为空', trigger: 'change' }],
  },
  {
    field: 'versionCode',
    label: '版本号',
    component: 'number',
    props: { min: 1, step: 1 },
    placeholder: '数值比较用，如 5',
    rules: [{ required: true, message: 'versionCode 不能为空', trigger: 'blur' }],
  },
  {
    field: 'versionName',
    label: '版本名',
    component: 'input',
    placeholder: '展示用，如 2.0.0（最长 32 字）',
    rules: [{ required: true, message: '版本名不能为空', trigger: 'blur' }],
  },
  {
    field: 'forceUpdate',
    label: '强制更新',
    component: 'radio',
    options: [
      { label: '否', value: 0 },
      { label: '是', value: 1 },
    ],
    rules: [{ required: true, message: '强制更新不能为空', trigger: 'change' }],
  },
  { field: 'downloadUrl', label: '下载地址', component: 'input', placeholder: '直装 apk / 应用市场链接，最长 500 字' },
  { field: 'notice', label: '更新说明', component: 'textarea', placeholder: '将作为公告展示给用户，最长 1000 字' },
];

function openAdd(): void {
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, { platform: 'ANDROID', forceUpdate: 0 });
  dialogVisible.value = true;
}

function openEdit(row: AppVersionVO): void {
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()?.catch(() => false);
  if (!valid) return;
  confirmLoading.value = true;
  try {
    const body: AppVersionSaveRequest = {
      platform: formModel.platform as string,
      versionCode: formModel.versionCode as number,
      versionName: formModel.versionName as string,
      forceUpdate: formModel.forceUpdate as number,
      downloadUrl: (formModel.downloadUrl as string) || undefined,
      notice: (formModel.notice as string) || undefined,
    };
    if (isEdit.value) {
      await updateVersion(formModel.id as string, body);
    } else {
      await createVersion(body);
    }
    ElMessage.success(isEdit.value ? '修改成功（草稿）' : '新增成功（草稿）');
    dialogVisible.value = false;
    await load();
  } finally {
    confirmLoading.value = false;
  }
}

// ---------- 发布 / 删除（均仅草稿；发布后单向锁定） ----------
async function handlePublish(row: AppVersionVO): Promise<void> {
  const platformLabel = row.platform === 'ANDROID' ? 'Android' : 'iOS';
  await ElMessageBox.confirm(
    `确定发布 ${platformLabel} ${row.versionName}（${row.versionCode}）吗？发布后该行将锁定，不可再修改或删除；要改内容只能发新版本号。`,
    '发布确认',
    { type: 'warning', confirmButtonText: '确认发布', cancelButtonText: '取消' },
  );
  await publishVersion(row.id);
  ElMessage.success('发布成功');
  await load();
}

async function handleDelete(row: AppVersionVO): Promise<void> {
  await ElMessageBox.confirm(`确定删除草稿「${row.versionName}」吗？`, '删除确认', { type: 'warning' });
  await removeVersion(row.id);
  ElMessage.success('删除成功');
  await load();
}
</script>

<template>
  <div class="page-card">
    <div class="version-page__bar">
      <ElButton v-hasPermi="'babylog:version:add'" type="primary" :icon="Plus" @click="openAdd">
        新增版本
      </ElButton>
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
      <template #platform="{ row }">
        <ElTag :type="(row as AppVersionVO).platform === 'ANDROID' ? 'primary' : 'warning'" disable-transitions>
          {{ (row as AppVersionVO).platform === 'ANDROID' ? 'Android' : 'iOS' }}
        </ElTag>
      </template>
      <template #forceUpdate="{ row }">
        <ElTag :type="(row as AppVersionVO).forceUpdate === 1 ? 'danger' : 'info'" disable-transitions>
          {{ (row as AppVersionVO).forceUpdate === 1 ? '强制' : '普通' }}
        </ElTag>
      </template>
      <template #status="{ row }">
        <ElTag :type="(row as AppVersionVO).status === 'PUBLISHED' ? 'success' : 'info'" disable-transitions>
          {{ (row as AppVersionVO).status === 'PUBLISHED' ? '已发布' : '草稿' }}
        </ElTag>
      </template>
      <ElTableColumn label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="(row as AppVersionVO).status === 'DRAFT'">
            <ElButton v-hasPermi="'babylog:version:edit'" link type="primary" @click="openEdit(row as AppVersionVO)">
              编辑
            </ElButton>
            <ElButton v-hasPermi="'babylog:version:publish'" link type="success" @click="handlePublish(row as AppVersionVO)">
              发布
            </ElButton>
            <ElButton v-hasPermi="'babylog:version:remove'" link type="danger" @click="handleDelete(row as AppVersionVO)">
              删除
            </ElButton>
          </template>
          <span v-else class="version-page__locked">已锁定</span>
        </template>
      </ElTableColumn>
    </YTable>

    <YDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑版本（草稿）' : '新增版本'"
      width="640px"
      :confirm-loading="confirmLoading"
      @confirm="handleSubmit"
    >
      <YForm ref="formRef" v-model="formModel" :schemas="formSchemas" label-width="90px" />
    </YDialog>
  </div>
</template>

<style scoped>
.version-page__bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.version-page__locked {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

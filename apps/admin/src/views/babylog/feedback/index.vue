<script setup lang="ts">
defineOptions({ name: 'BabylogFeedback' });
import { reactive, ref } from 'vue';
import { ElButton, ElMessage, ElTableColumn, ElTag } from 'element-plus';
import { YDialog, YForm, YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type { FeedbackQuery, FeedbackVO } from '@pivotos/types';
import { replyFeedback } from '@/api/babylog/feedback';
import { useTablePage } from '@/hooks';

/**
 * 意见反馈（M10 契约：/babylog/feedback，bl_feedback）。
 * App 端匿名提交（登录了自动带 userId），本页只读 + 回复（PENDING → REPLIED）；
 * 回复内容先落库存档，App 端回显入口留后续版本。
 */

// ---------- 列表 ----------
const { loading, rows, total, params, load, search, reset } = useTablePage<FeedbackVO, FeedbackQuery>({
  url: '/babylog/feedback/page',
  query: { status: '' },
});

const STATUS_OPTIONS: YFormOption[] = [
  { label: '待处理', value: 'PENDING' },
  { label: '已回复', value: 'REPLIED' },
  { label: '已关闭', value: 'CLOSED' },
];

const STATUS_TAG: Record<string, { label: string; type: 'warning' | 'success' | 'info' }> = {
  PENDING: { label: '待处理', type: 'warning' },
  REPLIED: { label: '已回复', type: 'success' },
  CLOSED: { label: '已关闭', type: 'info' },
};

const searchSchemas: YFormSchema[] = [
  { field: 'status', label: '状态', component: 'select', placeholder: '全部', options: STATUS_OPTIONS },
];

const columns: YTableColumn<FeedbackVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 90, align: 'center' },
  { prop: 'userId', label: '提交用户', width: 110, align: 'center', slot: 'userId' },
  { prop: 'contact', label: '联系方式', width: 150, showOverflowTooltip: true },
  { prop: 'content', label: '反馈内容', minWidth: 300, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'reply', label: '回复', minWidth: 180, showOverflowTooltip: true },
  { prop: 'replyTime', label: '回复时间', width: 170 },
  { prop: 'createTime', label: '提交时间', width: 170 },
];

// ---------- 回复（PENDING/REPLIED 可写；对已回复行再次提交 = 覆盖旧回复） ----------
const dialogVisible = ref(false);
const confirmLoading = ref(false);
const formRef = ref<InstanceType<typeof YForm>>();
const formModel = reactive<Record<string, unknown>>({});

const formSchemas: YFormSchema[] = [
  {
    field: 'reply',
    label: '回复内容',
    component: 'textarea',
    placeholder: '最长 1000 字，先落库存档',
    rules: [{ required: true, message: '回复内容不能为空', trigger: 'blur' }],
  },
];

function openReply(row: FeedbackVO): void {
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, { id: row.id, reply: row.reply ?? '', content: row.content, contact: row.contact, status: row.status });
  dialogVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()?.catch(() => false);
  if (!valid) return;
  confirmLoading.value = true;
  try {
    await replyFeedback(formModel.id as string, { reply: (formModel.reply as string).trim() });
    ElMessage.success('回复成功');
    dialogVisible.value = false;
    await load();
  } finally {
    confirmLoading.value = false;
  }
}
</script>

<template>
  <div class="page-card">
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
      <template #userId="{ row }">
        <span v-if="(row as FeedbackVO).userId">{{ (row as FeedbackVO).userId }}</span>
        <ElTag v-else type="info" disable-transitions>匿名</ElTag>
      </template>
      <template #status="{ row }">
        <ElTag :type="STATUS_TAG[(row as FeedbackVO).status]?.type ?? 'info'" disable-transitions>
          {{ STATUS_TAG[(row as FeedbackVO).status]?.label ?? (row as FeedbackVO).status }}
        </ElTag>
      </template>
      <ElTableColumn label="操作" width="110" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton
            v-if="(row as FeedbackVO).status !== 'CLOSED'"
            v-hasPermi="'babylog:feedback:reply'"
            link
            type="primary"
            @click="openReply(row as FeedbackVO)"
          >
            {{ (row as FeedbackVO).status === 'REPLIED' ? '修改回复' : '回复' }}
          </ElButton>
        </template>
      </ElTableColumn>
    </YTable>

    <YDialog
      v-model="dialogVisible"
      :title="formModel.status === 'REPLIED' ? '修改回复' : '回复反馈'"
      width="640px"
      :confirm-loading="confirmLoading"
      @confirm="handleSubmit"
    >
      <div class="feedback-reply__origin">
        <div class="feedback-reply__label">原始反馈</div>
        <div class="feedback-reply__content">{{ formModel.content }}</div>
        <div v-if="formModel.contact" class="feedback-reply__contact">联系方式：{{ formModel.contact }}</div>
      </div>
      <YForm ref="formRef" v-model="formModel" :schemas="formSchemas" label-width="80px" />
    </YDialog>
  </div>
</template>

<style scoped>
.feedback-reply__origin {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.feedback-reply__label {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.feedback-reply__content {
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.feedback-reply__contact {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

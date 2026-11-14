<script setup lang="ts">
defineOptions({ name: 'BabylogRecordTypeRule' });
import { reactive, ref } from 'vue';
import { ElButton, ElMessage, ElTableColumn, ElTag } from 'element-plus';
import { YDialog, YForm, YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type { RecordTypeRuleEditRequest, RecordTypeRuleQuery, RecordTypeRuleVO } from '@pivotos/types';
import { updateRecordTypeRule } from '@/api/babylog/recordTypeRule';
import { useTablePage } from '@/hooks';

/**
 * 记录类型云端规则（M41 契约：/babylog/record-type-rule，bl_record_type_rule）。
 *
 * 边界写死（10 文档第八节）：本页只能调「已有记录类型」的默认开关、起止月龄、
 * 记录页排序、分组、显示文案——刻意没有「新增」按钮（也无新增端点）；
 * 新增记录类型永远走 App 发版，防止膨胀成动态表单引擎。
 *
 * 字段的 null 语义：enabled/startAgeDays/endAgeDays 为 null = 「该项不覆盖，
 * 回落客户端代码默认」——运营只想改文案或排序时不用被迫填齐。
 */

// ---------- 列表（21 行 seed，一页拉完；服务端按分类+排序升序返回） ----------
const { loading, rows, total, params, load, search, reset } = useTablePage<RecordTypeRuleVO, RecordTypeRuleQuery>({
  url: '/babylog/record-type-rule/page',
  query: { category: '', recordType: '', pageSize: 100 },
});

const CATEGORY_OPTIONS: YFormOption[] = [
  { label: '喂养', value: 'FEEDING' },
  { label: '护理', value: 'CARE' },
  { label: '健康', value: 'HEALTH' },
  { label: '医疗', value: 'MEDICAL' },
];

const CATEGORY_LABEL: Record<string, string> = {
  FEEDING: '喂养',
  CARE: '护理',
  HEALTH: '健康',
  MEDICAL: '医疗',
};

const searchSchemas: YFormSchema[] = [
  { field: 'category', label: '分类', component: 'select', placeholder: '全部', options: CATEGORY_OPTIONS },
  { field: 'recordType', label: '类型标识', component: 'input', placeholder: '如 BOTTLE（模糊）' },
];

const columns: YTableColumn<RecordTypeRuleVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'category', label: '分类', width: 90, align: 'center', slot: 'category' },
  { prop: 'recordType', label: '类型标识', width: 140 },
  { prop: 'displayLabel', label: '显示文案', minWidth: 110, slot: 'displayLabel' },
  { prop: 'enabled', label: '默认开关', width: 100, align: 'center', slot: 'enabled' },
  { prop: 'startAgeDays', label: '起始月龄', width: 100, align: 'center', slot: 'startAgeDays' },
  { prop: 'endAgeDays', label: '截止月龄', width: 100, align: 'center', slot: 'endAgeDays' },
  { prop: 'sortOrder', label: '排序', width: 76, align: 'center' },
  { prop: 'groupKey', label: '分组', width: 90, align: 'center', slot: 'groupKey' },
];

// ---------- 编辑（唯一写操作；recordType 不可改） ----------
const dialogVisible = ref(false);
const confirmLoading = ref(false);
const formRef = ref<InstanceType<typeof YForm>>();
const formModel = reactive<Record<string, unknown>>({});
const editingRow = ref<RecordTypeRuleVO | null>(null);

/** 开关三态：'' = 回落代码默认（提交时转 null） */
const ENABLED_TRISTATE_OPTIONS: YFormOption[] = [
  { label: '回落代码默认', value: '' },
  { label: '默认开', value: '1' },
  { label: '默认关', value: '0' },
];

const formSchemas: YFormSchema[] = [
  {
    field: 'enabled',
    label: '默认开关',
    component: 'select',
    options: ENABLED_TRISTATE_OPTIONS,
    props: { clearable: false },
    placeholder: '回落代码默认',
  },
  {
    field: 'startAgeDays',
    label: '起始月龄(天)',
    component: 'number',
    props: { min: 0, step: 1 },
    placeholder: '留空 = 回落代码默认',
  },
  {
    field: 'endAgeDays',
    label: '截止月龄(天)',
    component: 'number',
    props: { min: 0, step: 1 },
    placeholder: '留空 = 回落代码默认；都留空 = 永不自动收起',
  },
  {
    field: 'sortOrder',
    label: '记录页排序',
    component: 'number',
    props: { min: 0, step: 10 },
    placeholder: '小的在前',
  },
  { field: 'groupKey', label: '分组键', component: 'input', placeholder: '留空 = 默认不分组（最长 32 字）' },
  { field: 'displayLabel', label: '显示文案', component: 'input', placeholder: '留空 = 回落代码默认文案（最长 32 字）' },
];

function openEdit(row: RecordTypeRuleVO): void {
  editingRow.value = row;
  Object.keys(formModel).forEach((k) => delete formModel[k]);
  Object.assign(formModel, {
    // null 归一成 ''，让三态 select 显示「回落代码默认」
    enabled: row.enabled == null ? '' : String(row.enabled),
    startAgeDays: row.startAgeDays ?? undefined,
    endAgeDays: row.endAgeDays ?? undefined,
    sortOrder: row.sortOrder ?? 0,
    groupKey: row.groupKey ?? '',
    displayLabel: row.displayLabel ?? '',
  });
  dialogVisible.value = true;
}

async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate()?.catch(() => false);
  if (!valid || !editingRow.value) return;
  confirmLoading.value = true;
  try {
    const body: RecordTypeRuleEditRequest = {
      // '' 回 null = 「该项不覆盖」
      enabled: formModel.enabled === '' || formModel.enabled == null ? null : Number(formModel.enabled),
      startAgeDays: formModel.startAgeDays == null || formModel.startAgeDays === '' ? null : Number(formModel.startAgeDays),
      endAgeDays: formModel.endAgeDays == null || formModel.endAgeDays === '' ? null : Number(formModel.endAgeDays),
      sortOrder: formModel.sortOrder == null || formModel.sortOrder === '' ? 0 : Number(formModel.sortOrder),
      groupKey: (formModel.groupKey as string) || null,
      displayLabel: (formModel.displayLabel as string) || null,
    };
    await updateRecordTypeRule(editingRow.value.id, body);
    ElMessage.success('已保存，客户端经基础数据通道拉取后生效');
    dialogVisible.value = false;
    await load();
  } finally {
    confirmLoading.value = false;
  }
}

// ---------- 展示辅助 ----------
const ageText = (days?: number | null): string => {
  if (days == null) return '默认';
  if (days < 60) return `${days} 天`;
  if (days < 730) return `约 ${Math.floor(days / 30)} 个月`;
  return `约 ${Math.floor(days / 365)} 岁`;
};
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
      <template #category="{ row }">
        <ElTag disable-transitions>{{ CATEGORY_LABEL[(row as RecordTypeRuleVO).category] ?? (row as RecordTypeRuleVO).category }}</ElTag>
      </template>
      <template #displayLabel="{ row }">
        <span v-if="(row as RecordTypeRuleVO).displayLabel">{{ (row as RecordTypeRuleVO).displayLabel }}</span>
        <span v-else class="rule-page__fallback">默认</span>
      </template>
      <template #enabled="{ row }">
        <template v-if="(row as RecordTypeRuleVO).enabled == null">
          <span class="rule-page__fallback">默认</span>
        </template>
        <ElTag v-else :type="(row as RecordTypeRuleVO).enabled === 1 ? 'success' : 'danger'" disable-transitions>
          {{ (row as RecordTypeRuleVO).enabled === 1 ? '默认开' : '默认关' }}
        </ElTag>
      </template>
      <template #startAgeDays="{ row }">
        <span v-if="(row as RecordTypeRuleVO).startAgeDays == null" class="rule-page__fallback">默认</span>
        <span v-else>{{ ageText((row as RecordTypeRuleVO).startAgeDays) }}</span>
      </template>
      <template #endAgeDays="{ row }">
        <span v-if="(row as RecordTypeRuleVO).endAgeDays == null" class="rule-page__fallback">默认</span>
        <span v-else>{{ ageText((row as RecordTypeRuleVO).endAgeDays) }}</span>
      </template>
      <template #groupKey="{ row }">
        <span v-if="(row as RecordTypeRuleVO).groupKey">{{ (row as RecordTypeRuleVO).groupKey }}</span>
        <span v-else class="rule-page__fallback">—</span>
      </template>
      <ElTableColumn label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton v-hasPermi="'babylog:recordTypeRule:edit'" link type="primary" @click="openEdit(row as RecordTypeRuleVO)">
            编辑
          </ElButton>
        </template>
      </ElTableColumn>
    </YTable>

    <YDialog
      v-model="dialogVisible"
      :title="`编辑规则 · ${editingRow?.recordType ?? ''}`"
      width="560px"
      :confirm-loading="confirmLoading"
      @confirm="handleSubmit"
    >
      <YForm ref="formRef" v-model="formModel" :schemas="formSchemas" label-width="110px" />
    </YDialog>
  </div>
</template>

<style scoped>
.rule-page__fallback {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

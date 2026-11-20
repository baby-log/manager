<script setup lang="ts">
defineOptions({ name: 'BabylogAdminRecord' });
import { ref } from 'vue';
import { ElTabPane, ElTabs, ElTag } from 'element-plus';
import { YSearchForm, YTable } from '@pivotos/ui';
import type { YFormOption, YFormSchema, YTableColumn } from '@pivotos/ui';
import type {
  AdminRecordQuery,
  AdminRecordVO,
  AdminReminderQuery,
  AdminReminderVO,
  AdminVaccinationQuery,
  AdminVaccinationVO,
} from '@pivotos/types';
import { ADMIN_RECORD_TABLES } from '@pivotos/types';
import { ADMIN_API, formatAdminBool, formatAdminTime } from '@/api/babylog/adminConsole';
import { useTablePage } from '@/hooks';

/**
 * 全部记录（M53，/babylog/admin/record/page）+ 疫苗 / 提醒子表。
 * 只读：跨用户、婴儿健康敏感数据，查看操作留审计；summary 由服务端拼好，前端不二次加工。
 */
const activeTab = ref('record');

const TABLE_LABEL: Record<string, string> = {
  feedings: '喂养',
  diapers: '换尿布',
  sleeps: '睡眠',
  baths: '洗澡',
  spits: '吐奶',
  pump_sessions: '吸奶',
  measurements: '生长测量',
  medications: '用药',
  vaccinations: '疫苗接种',
  follow_ups: '随访',
  visits: '就诊',
};
const TABLE_OPTIONS: YFormOption[] = ADMIN_RECORD_TABLES.map((t) => ({ label: TABLE_LABEL[t] ?? t, value: t }));

// ---------- 全部记录 ----------
const {
  loading: recordLoading,
  rows: recordRows,
  total: recordTotal,
  params: recordParams,
  load: loadRecord,
  search: searchRecord,
  reset: resetRecord,
} = useTablePage<AdminRecordVO, AdminRecordQuery>({
  url: ADMIN_API.recordPage,
  query: { table: '', userId: '', familyId: '', childId: '', from: '', to: '' },
});

const recordSchemas: YFormSchema[] = [
  { field: 'table', label: '记录表', component: 'select', placeholder: '选择记录表', emptyOption: '默认（喂养记录）', options: TABLE_OPTIONS },
  { field: 'userId', label: '用户 ID', component: 'input', placeholder: '按所属用户筛选' },
  { field: 'familyId', label: '家庭 ID', component: 'input', placeholder: '按家庭筛选' },
  { field: 'childId', label: '宝宝 ID', component: 'input', placeholder: '按宝宝筛选' },
  { field: 'from', label: '起始日期', component: 'date', placeholder: 'YYYY-MM-DD' },
  { field: 'to', label: '截止日期', component: 'date', placeholder: 'YYYY-MM-DD' },
];

const recordColumns: YTableColumn<AdminRecordVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: '记录 ID', width: 180, showOverflowTooltip: true },
  { prop: 'table', label: '记录表', width: 120, align: 'center', slot: 'table' },
  { prop: 'type', label: '类型', width: 120 },
  { prop: 'summary', label: '摘要（服务端生成）', minWidth: 260, showOverflowTooltip: true },
  { prop: 'childId', label: '宝宝 ID', width: 180, showOverflowTooltip: true },
  { prop: 'userId', label: '用户 ID', width: 180, showOverflowTooltip: true },
  { prop: 'startedAt', label: '发生时间', width: 180, formatter: (row) => formatAdminTime(row.startedAt) },
  { prop: 'createdAt', label: '创建时间', width: 180, formatter: (row) => formatAdminTime(row.createdAt) },
  { prop: 'deleted', label: '已删除', width: 90, align: 'center', formatter: (row) => formatAdminBool(row.deleted) },
];

// ---------- 疫苗 ----------
const {
  loading: vaccinationLoading,
  rows: vaccinationRows,
  total: vaccinationTotal,
  params: vaccinationParams,
  load: loadVaccination,
  search: searchVaccination,
  reset: resetVaccination,
} = useTablePage<AdminVaccinationVO, AdminVaccinationQuery>({
  url: ADMIN_API.vaccinationPage,
  query: { userId: '', childId: '', status: '' },
});

const vaccinationSchemas: YFormSchema[] = [
  { field: 'userId', label: '用户 ID', component: 'input', placeholder: '按所属用户筛选' },
  { field: 'childId', label: '宝宝 ID', component: 'input', placeholder: '按宝宝筛选' },
  { field: 'status', label: '状态', component: 'input', placeholder: '如 PENDING / DONE' },
];

const vaccinationColumns: YTableColumn<AdminVaccinationVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 180, showOverflowTooltip: true },
  { prop: 'childId', label: '宝宝 ID', width: 180, showOverflowTooltip: true },
  { prop: 'childName', label: '宝宝', minWidth: 120 },
  { prop: 'vaccineName', label: '疫苗名称', minWidth: 160 },
  { prop: 'doseNo', label: '剂次', width: 90, align: 'center' },
  { prop: 'scheduledAt', label: '预约时间', width: 180, formatter: (row) => formatAdminTime(row.scheduledAt) },
  { prop: 'doneAt', label: '完成时间', width: 180, formatter: (row) => formatAdminTime(row.doneAt) },
  { prop: 'status', label: '状态', width: 120, align: 'center' },
];

// ---------- 提醒 ----------
const {
  loading: reminderLoading,
  rows: reminderRows,
  total: reminderTotal,
  params: reminderParams,
  load: loadReminder,
  search: searchReminder,
  reset: resetReminder,
} = useTablePage<AdminReminderVO, AdminReminderQuery>({
  url: ADMIN_API.reminderPage,
  query: { userId: '', childId: '' },
});

const reminderSchemas: YFormSchema[] = [
  { field: 'userId', label: '用户 ID', component: 'input', placeholder: '按所属用户筛选' },
  { field: 'childId', label: '宝宝 ID', component: 'input', placeholder: '按宝宝筛选' },
];

const reminderColumns: YTableColumn<AdminReminderVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 180, showOverflowTooltip: true },
  { prop: 'childId', label: '宝宝 ID', width: 180, showOverflowTooltip: true },
  { prop: 'childName', label: '宝宝', minWidth: 120 },
  { prop: 'kind', label: '类型', width: 120 },
  { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
  { prop: 'dueAt', label: '到期时间', width: 180, formatter: (row) => formatAdminTime(row.dueAt) },
  { prop: 'level', label: '级别', width: 100, align: 'center' },
];
</script>

<template>
  <div class="page-card">
    <div class="admin-record__tip">
      只读查询：跨用户记录明细（含疫苗 / 提醒），涉及婴儿健康敏感数据，查看操作留审计；摘要由服务端生成。
    </div>

    <ElTabs v-model="activeTab">
      <ElTabPane label="全部记录" name="record">
        <YSearchForm v-model="recordParams" :schemas="recordSchemas" @search="searchRecord" @reset="resetRecord" />
        <YTable
          v-model:page-num="recordParams.pageNum"
          v-model:page-size="recordParams.pageSize"
          :loading="recordLoading"
          :data="recordRows"
          :columns="recordColumns"
          :total="recordTotal"
          row-key="id"
          @refresh="loadRecord"
        >
          <template #table="{ row }">
            <ElTag disable-transitions>
              {{ TABLE_LABEL[(row as AdminRecordVO).table] ?? (row as AdminRecordVO).table }}
            </ElTag>
          </template>
        </YTable>
      </ElTabPane>

      <ElTabPane label="疫苗" name="vaccination">
        <YSearchForm v-model="vaccinationParams" :schemas="vaccinationSchemas" @search="searchVaccination" @reset="resetVaccination" />
        <YTable
          v-model:page-num="vaccinationParams.pageNum"
          v-model:page-size="vaccinationParams.pageSize"
          :loading="vaccinationLoading"
          :data="vaccinationRows"
          :columns="vaccinationColumns"
          :total="vaccinationTotal"
          row-key="id"
          @refresh="loadVaccination"
        />
      </ElTabPane>

      <ElTabPane label="提醒" name="reminder">
        <YSearchForm v-model="reminderParams" :schemas="reminderSchemas" @search="searchReminder" @reset="resetReminder" />
        <YTable
          v-model:page-num="reminderParams.pageNum"
          v-model:page-size="reminderParams.pageSize"
          :loading="reminderLoading"
          :data="reminderRows"
          :columns="reminderColumns"
          :total="reminderTotal"
          row-key="id"
          @refresh="loadReminder"
        />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.admin-record__tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<script setup lang="ts">
defineOptions({ name: 'BabylogKbFaq' });
import { computed, onMounted, reactive, ref } from 'vue';
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { Delete, EditPen, Plus, Search } from '@element-plus/icons-vue';
import { YTable } from '@pivotos/ui';
import type { YTableColumn } from '@pivotos/ui';
import type { KbFaqSaveCmd, KbFaqVO } from '@/api/babylog/kb';
import { deleteKbFaq, listKbFaq, saveKbFaq } from '@/api/babylog/kb';

/**
 * 育儿知识库 FAQ 维护（K6-S / M76，ui 管理端增量，只落 views/babylog/ + api/babylog/）。
 *
 * 10 号 §4.1 三条红线在本页的落点：
 *  ① 来源可追溯：source 必填（前端校验 + 服务端 8465），正文限 2000 字、禁整篇搬运；
 *  ② 全程「非医疗建议」免责：页面顶部常驻固定提示，与服务端问答响应同一句文案；
 *  ③ 答案必带引用条目：本页只维护条目，RAG 问答由 app 端 /app/babylog/kb/ask 走
 *     IKnowledgeBaseFacade，检索为空时不裸生成。
 *
 * 文案红线：禁用词（「智能分析」「精准」「AI 诊断」「一键生成」「保证准确」「医学建议」）
 * 0 处用于 UI；只允许「育儿知识库」「仅供参考」「不构成医疗建议，异常请及时就医」等。
 *
 * 动态路由：菜单 component 串必须是 `babylog/kbFaq/index`（与目录逐字一致，
 * permission.ts 用 import.meta.glob 装配），本页不改前端路由表。
 * 菜单权限字符 / @SaCheckPermission 配套按 K3 先例登记到「遗留与移交」，
 * 本页不使用 v-hasPermi，靠菜单可见性控制访问。
 *
 * 全局契约：所有 Long（id）是字符串；enabled 用整数 1/0，绝不发 true/false；
 * null 键缺省、前端容忍缺键（VO 字段全可选）。
 */

const DISCLAIMER = '仅供参考，不构成医疗建议，异常请及时就医';
const MAX_CONTENT = 2000;

const CATEGORY_OPTIONS = [
  { label: '喂养', value: 'FEEDING' },
  { label: '睡眠', value: 'SLEEP' },
  { label: '健康', value: 'HEALTH' },
  { label: '生长', value: 'GROWTH' },
  { label: '安全', value: 'SAFETY' },
  { label: '其他', value: 'OTHER' },
];

const loading = ref(false);
const rows = ref<KbFaqVO[]>([]);
const category = ref('');
const keyword = ref('');

const columns: YTableColumn<KbFaqVO>[] = [
  { type: 'index', label: '#', width: 56, align: 'center' },
  { prop: 'id', label: 'ID', width: 170, align: 'center' },
  { prop: 'category', label: '分类', width: 90, align: 'center' },
  { prop: 'title', label: '标题', minWidth: 160, showOverflowTooltip: true },
  { prop: 'source', label: '资料来源', minWidth: 180, showOverflowTooltip: true },
  { prop: 'enabled', label: '状态', width: 90, align: 'center', slot: 'enabled' },
  { prop: 'sortOrder', label: '排序', width: 80, align: 'center' },
];

async function load(): Promise<void> {
  loading.value = true;
  try {
    rows.value = await listKbFaq(category.value, keyword.value);
  } finally {
    loading.value = false;
  }
}

// ---------- 新增 / 编辑 ----------
const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = computed(() => !!form.id);
const form = reactive<KbFaqSaveCmd>({
  id: undefined,
  category: 'FEEDING',
  title: '',
  content: '',
  source: '',
  sourceUrl: '',
  enabled: 1,
  sortOrder: 0,
});

function resetForm(): void {
  form.id = undefined;
  form.category = 'FEEDING';
  form.title = '';
  form.content = '';
  form.source = '';
  form.sourceUrl = '';
  form.enabled = 1;
  form.sortOrder = 0;
}

function openCreate(): void {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: KbFaqVO): void {
  form.id = row.id;
  form.category = row.category ?? 'OTHER';
  form.title = row.title ?? '';
  form.content = row.content ?? '';
  form.source = row.source ?? '';
  form.sourceUrl = row.sourceUrl ?? '';
  form.enabled = row.enabled ?? 1;
  form.sortOrder = row.sortOrder ?? 0;
  dialogVisible.value = true;
}

async function handleSave(): Promise<void> {
  const payload: KbFaqSaveCmd = {
    ...form,
    category: form.category.trim(),
    title: form.title.trim(),
    content: form.content.trim(),
    source: form.source.trim(),
    sourceUrl: form.sourceUrl?.trim() || undefined,
  };
  if (!payload.category || !payload.title || !payload.content) {
    ElMessage.warning('分类 / 标题 / 正文不能为空');
    return;
  }
  if (!payload.source) {
    ElMessage.warning('请填写资料来源（内容来源必须可追溯）');
    return;
  }
  if (payload.content.length > MAX_CONTENT) {
    ElMessage.warning(`正文不能超过 ${MAX_CONTENT} 字，请摘录要点，禁止整篇搬运`);
    return;
  }
  saving.value = true;
  try {
    await saveKbFaq(payload);
    ElMessage.success('已保存');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: KbFaqVO): Promise<void> {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(
      `确定删除条目「${row.title || row.id}」吗？该条目的收藏关联会一并清除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    );
  } catch {
    return; // 取消：静默返回，不产生未处理拒绝
  }
  await deleteKbFaq(row.id);
  ElMessage.success('已删除');
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page-card">
    <div class="kb-faq__notice">
      <ElTag type="warning" disable-transitions>合规提示</ElTag>
      <span>{{ DISCLAIMER }}</span>
    </div>

    <div class="kb-faq__search">
      <ElSelect v-model="category" placeholder="全部分类" clearable class="kb-faq__category">
        <ElOption v-for="o in CATEGORY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
      </ElSelect>
      <ElInput
        v-model="keyword"
        placeholder="按标题 / 正文搜索"
        clearable
        class="kb-faq__keyword"
        @keyup.enter="load"
      />
      <ElButton type="primary" :icon="Search" :loading="loading" @click="load">查询</ElButton>
      <ElButton type="success" :icon="Plus" @click="openCreate">新增条目</ElButton>
    </div>

    <YTable :loading="loading" :data="rows" :columns="columns" row-key="id" hide-pagination @refresh="load">
      <template #enabled="{ row }">
        <ElTag :type="(row as KbFaqVO).enabled === 1 ? 'success' : 'info'" disable-transitions>
          {{ (row as KbFaqVO).enabled === 1 ? '已上架' : '已下架' }}
        </ElTag>
      </template>
      <ElTableColumn label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" :icon="EditPen" @click="openEdit(row as KbFaqVO)">编辑</ElButton>
          <ElButton link type="danger" :icon="Delete" @click="handleDelete(row as KbFaqVO)">删除</ElButton>
        </template>
      </ElTableColumn>
    </YTable>

    <ElDialog v-model="dialogVisible" :title="isEdit ? '编辑知识条目' : '新增知识条目'" width="640px">
      <div class="kb-faq__form">
        <label>分类</label>
        <ElSelect v-model="form.category" class="kb-faq__field">
          <ElOption v-for="o in CATEGORY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </ElSelect>
        <label>标题</label>
        <ElInput v-model="form.title" maxlength="200" show-word-limit placeholder="条目标题（最长 200 字）" />
        <label>正文摘录（最长 {{ MAX_CONTENT }} 字，禁止整篇搬运）</label>
        <ElInput
          v-model="form.content"
          type="textarea"
          :rows="6"
          :maxlength="MAX_CONTENT"
          show-word-limit
          placeholder="摘录权威资料要点，不要整篇搬运网络文章"
        />
        <label>资料来源（必填）</label>
        <ElInput
          v-model="form.source"
          maxlength="500"
          show-word-limit
          placeholder="如：国家卫健委《婴幼儿喂养指南》、某某医院科普手册"
        />
        <label>来源链接（可选）</label>
        <ElInput v-model="form.sourceUrl" placeholder="https://..." />
        <div class="kb-faq__row">
          <label>状态</label>
          <ElSelect v-model="form.enabled" class="kb-faq__field">
            <ElOption label="已上架" :value="1" />
            <ElOption label="已下架" :value="0" />
          </ElSelect>
          <label>排序</label>
          <ElInput v-model.number="form.sortOrder" placeholder="数字小的在前" />
        </div>
        <p class="kb-faq__hint">
          {{ DISCLAIMER }}；每条必须标注来源，AI 回答必须带引用条目，不允许裸生成。
        </p>
      </div>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.kb-faq__notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
}

.kb-faq__search {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.kb-faq__category {
  width: 160px;
}

.kb-faq__keyword {
  width: 260px;
}

.kb-faq__form {
  display: grid;
  gap: 8px;
}

.kb-faq__form label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.kb-faq__field {
  width: 100%;
}

.kb-faq__row {
  display: grid;
  grid-template-columns: 40px 1fr 40px 1fr;
  gap: 8px;
  align-items: center;
}

.kb-faq__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
</style>

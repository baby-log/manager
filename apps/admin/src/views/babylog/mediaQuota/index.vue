<script setup lang="ts">
defineOptions({ name: 'BabylogMediaQuota' });
import { computed, reactive, ref } from 'vue';
import { ElButton, ElDescriptions, ElDescriptionsItem, ElDialog, ElInput, ElMessage, ElTag } from 'element-plus';
import { Search, EditPen } from '@element-plus/icons-vue';
import type { MediaQuotaVO } from '@pivotos/types';
import { adjustMediaQuota, getMediaQuota } from '@/api/babylog/media';

/**
 * 媒体容量配额（K3 / M70 接入侧；服务端底座见 K2/M69 `docs/media-endpoints-M69.md` §二）。
 *
 * 每宝宝「初始容量展示」+ 后台「动态调整」：
 * - 读 `GET /app/babylog/media/quota?childId=`（端点 #7，App 前缀）
 * - 写 `PUT /babylog/media/quota`（端点 #8，管理端前缀），字段 childId + ownerUserId + adjustedBytes
 *   已存在行服务端保留原 user_id；ownerUserId 仅「行尚不存在」时建行用。
 *
 * 菜单权限字符（K2→K3 移交点，端点文档 §2.2「K3 配额页落地时再一并登记」）：
 *   本页登记 `babylog:media:list`（查询）/ `babylog:media:adjust`（调整）两个字面量，
 *   菜单 component 必须是 `babylog/mediaQuota/index`（与目录名逐字一致，否则 permission.ts
 *   的 glob 装配退化 404）。
 *   ⚠️ 真正的 sys_menu 行 / `@SaCheckPermission` 注解 / `AdminControllerPermissionContractTest`
 *   纳入都在 **server 仓**，K3 红线「只改 Android/iOS/Mini/TV/ui 五仓」不覆盖，故本节点
 *   只在页面与文档中登记字符，server 侧落地登记到「遗留与移交」，交龙哥/后续服务端节点。
 *
 * 全局契约坑：所有 Long 是字符串（字节数不做运算，展示用 BigInt 安全区间判断）、
 * adjustedBytes 可空缺键要容忍。边界：V3 前零画面数据，本页只读写容量，不承载媒体文件本身。
 */

const childId = ref('');
const loading = ref(false);
const quota = ref<MediaQuotaVO | null>(null);

/** 字节数展示：只读字符串转可读单位，绝不做数值运算（Long 字符串口径）。 */
function formatBytes(value?: string): string {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GiB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(2)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${value} B`;
}

/** 用量占比：used / effective（都按字符串读，展示用，幂等降级）。 */
const usedPercent = computed(() => {
  const q = quota.value;
  if (!q) return 0;
  const used = Number(q.usedBytes);
  const effective = Number(q.effectiveBytes);
  if (!Number.isFinite(used) || !Number.isFinite(effective) || effective <= 0) return 0;
  return Math.min(100, Math.round((used / effective) * 100));
});

async function handleSearch(): Promise<void> {
  const id = childId.value.trim();
  if (!id) {
    ElMessage.warning('请输入宝宝 ID 再查询');
    return;
  }
  loading.value = true;
  try {
    quota.value = await getMediaQuota(id);
  } finally {
    loading.value = false;
  }
}

// ---------- 调整（childId + ownerUserId + adjustedBytes，全字符串上送） ----------
const adjustVisible = ref(false);
const adjusting = ref(false);
const adjustForm = reactive({ childId: '', ownerUserId: '', adjustedBytes: '' });

function openAdjust(): void {
  adjustForm.childId = childId.value.trim() || quota.value?.childId || '';
  adjustForm.ownerUserId = '';
  adjustForm.adjustedBytes = quota.value?.adjustedBytes ?? '';
  adjustVisible.value = true;
}

async function handleAdjust(): Promise<void> {
  const cid = adjustForm.childId.trim();
  const owner = adjustForm.ownerUserId.trim();
  const bytes = adjustForm.adjustedBytes.trim();
  if (!cid || !owner || bytes === '') {
    ElMessage.warning('宝宝 ID / 归属用户 ID / 调整容量均不能为空');
    return;
  }
  if (!/^\d+$/.test(bytes)) {
    ElMessage.warning('调整容量必须是非负整数字节数（>= 0，否则 8425）');
    return;
  }
  adjusting.value = true;
  try {
    quota.value = await adjustMediaQuota({
      childId: cid,
      ownerUserId: owner,
      adjustedBytes: bytes,
    });
    ElMessage.success('配额已调整');
    adjustVisible.value = false;
  } finally {
    adjusting.value = false;
  }
}
</script>

<template>
  <div class="page-card">
    <div class="media-quota__search">
      <ElInput
        v-model="childId"
        class="media-quota__input"
        placeholder="宝宝 ID（字符串化的 Long）"
        clearable
        @keyup.enter="handleSearch"
      />
      <ElButton v-hasPermi="'babylog:media:list'" type="primary" :icon="Search" :loading="loading" @click="handleSearch">
        查询
      </ElButton>
    </div>

    <template v-if="quota">
      <ElDescriptions :column="2" border class="media-quota__desc">
        <ElDescriptionsItem label="宝宝 ID">{{ quota.childId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="配额行 ID">{{ quota.id ?? '—' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="初始容量">{{ formatBytes(quota.initialBytes) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="后台调整值">
          {{ quota.adjustedBytes === undefined ? '未调整（缺键）' : formatBytes(quota.adjustedBytes) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="生效容量">{{ formatBytes(quota.effectiveBytes) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="已用 / 剩余">
          {{ formatBytes(quota.usedBytes) }} / {{ formatBytes(quota.remainingBytes) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用量占比">
          <ElTag :type="usedPercent >= 90 ? 'danger' : usedPercent >= 70 ? 'warning' : 'success'" disable-transitions>
            {{ usedPercent }}%
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作">
          <ElButton v-hasPermi="'babylog:media:adjust'" link type="primary" :icon="EditPen" @click="openAdjust">
            动态调整
          </ElButton>
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>

    <div v-else class="media-quota__empty">
      输入宝宝 ID 后查询：展示初始容量 / 调整后 / 已用 / 剩余；本页只读写容量，不承载任何媒体画面数据。
    </div>

    <!-- 动态调整：显式 import 的 ElDialog（本项目无 element-plus 全局自动注册） -->
    <ElDialog v-model="adjustVisible" title="动态调整媒体容量" width="480px">
      <div class="media-quota__form">
        <label>宝宝 ID</label>
        <ElInput v-model="adjustForm.childId" placeholder="childId（字符串）" />
        <label>归属用户 ID</label>
        <ElInput v-model="adjustForm.ownerUserId" placeholder="ownerUserId（仅行不存在时建行用）" />
        <label>调整容量（字节，>= 0）</label>
        <ElInput v-model="adjustForm.adjustedBytes" placeholder="如 2147483648（2 GiB）" />
        <p class="media-quota__hint">服务端只写 adjustedBytes；已存在的配额行保留原 user_id，不会改归属。</p>
      </div>
      <template #footer>
        <ElButton @click="adjustVisible = false">取消</ElButton>
        <ElButton v-hasPermi="'babylog:media:adjust'" type="primary" :loading="adjusting" @click="handleAdjust">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.media-quota__search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.media-quota__input {
  width: 320px;
}

.media-quota__desc {
  margin-bottom: 12px;
}

.media-quota__empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.media-quota__form {
  display: grid;
  gap: 8px;
}

.media-quota__form label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.media-quota__hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
